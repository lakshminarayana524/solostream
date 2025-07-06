const express = require("express");
const router = express.Router();
const multer = require("multer");
const Video = require("../models/Video");
const Folder = require("../models/Folder");
const { exec } = require("child_process");
const { PassThrough } = require("stream");
const ffmpeg = require("fluent-ffmpeg");
const tmp = require("tmp");
const fs = require("fs");
const path = require("path");
const s3 = require("../utils/s3");
const { v4: uuid } = require("uuid");


const getDurationFromBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = new PassThrough();
    stream.end(buffer);
    ffmpeg.ffprobe(stream, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

const storage = multer.memoryStorage();
const upload = multer({ storage });

const sanitizeFileName = (name) =>
  name.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");

// 📥 Upload video to Wasabi
router.post("/upload/:folderId", upload.array("videos", 50), async (req, res) => {
  try {
    const folderId = req.params.folderId;
    const uploadedVideos = [];

    for (const file of req.files) {
      const cleanName = sanitizeFileName(file.originalname);
      const key = `videos/${uuid()}-${cleanName}`;

      await s3.upload({
        Bucket: process.env.WASABI_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }).promise();

      const sizeInBytes = file.size;
      const durationInSeconds = await getDurationFromBuffer(file.buffer);

      const video = new Video({
        name: file.originalname,
        url: key,
        size: sizeInBytes,
        duration: durationInSeconds,
        folder: folderId,
        captionsReady: false,
      });

      await video.save();
      await Folder.findByIdAndUpdate(folderId, { $push: { videos: video._id } });
      uploadedVideos.push(video);
    }

    res.status(201).json(uploadedVideos);
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Video upload failed" });
  }
});

// 🎥 Generate pre-signed streaming URL
router.get("/stream/:videoId", async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: process.env.WASABI_BUCKET,
      Key: video.url,
      Expires: 7200,
    });

    res.json({ url: signedUrl });
  } catch (err) {
    console.error("Presigned URL error:", err);
    res.status(500).json({ error: "Failed to generate video URL" });
  }
});

// 📂 Get all videos in folder
router.get("/folder/:folderId", async (req, res) => {
  try {
    const videos = await Video.find({ folder: req.params.folderId });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// ❌ Secure delete video
router.delete("/:videoId", async (req, res) => {

  const { videoId } = req.params;

  try {
    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    await s3.deleteObject({
      Bucket: process.env.WASABI_BUCKET,
      Key: video.url,
    }).promise();

    await Video.findByIdAndDelete(videoId);
    await Folder.findByIdAndUpdate(video.folder, { $pull: { videos: videoId } });

    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete video" });
  }
});

// 🧠 Generate Captions using Whisper CLI
router.post("/generate-captions/:videoId", async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    const videoKey = video.url;
    const videoTemp = tmp.fileSync({ postfix: ".mp4" });
    const videoStream = fs.createWriteStream(videoTemp.name);

    const s3Stream = s3.getObject({
      Bucket: process.env.WASABI_BUCKET,
      Key: videoKey,
    }).createReadStream();

    await new Promise((resolve, reject) =>
      s3Stream.pipe(videoStream).on("finish", resolve).on("error", reject)
    );

    const outputDir = tmp.dirSync();
    const outputPath = path.join(outputDir.name, "captions.vtt");

    exec(
      `whisper "${videoTemp.name}" --model tiny --output_format vtt --output_dir "${outputDir.name}"`,
      async (err) => {
        if (err) {
          console.error("Whisper failed:", err);
          return res.status(500).json({ error: "Whisper captioning failed" });
        }

        const vttData = fs.readFileSync(outputPath);
        const captionKey = `captions/${video._id}.vtt`;

        await s3
          .upload({
            Bucket: process.env.WASABI_BUCKET,
            Key: captionKey,
            Body: vttData,
            ContentType: "text/vtt",
          })
          .promise();

        await Video.findByIdAndUpdate(video._id, { captionsReady: true });

        res.json({ message: "Captions generated", captionKey });
      }
    );
  } catch (err) {
    console.error("Generate captions error:", err);
    res.status(500).json({ error: "Failed to generate captions" });
  }
});

// ✅ Captions URL Fetch
router.get("/captions/:videoId", async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    const captionKey = `captions/${video._id}.vtt`;

    await s3.headObject({
      Bucket: process.env.WASABI_BUCKET,
      Key: captionKey,
    }).promise();

    const captionUrl = s3.getSignedUrl("getObject", {
      Bucket: process.env.WASABI_BUCKET,
      Key: captionKey,
      Expires: 3600,
    });

    res.json({ captionUrl });
  } catch (err) {
    res.json({ captionUrl: null }); // Return null if not found
  }
});

// ✅ Caption readiness status
router.get("/captions/status/:videoId", async (req, res) => {
  const video = await Video.findById(req.params.videoId);
  if (!video) return res.status(404).json({ error: "Video not found" });

  res.json({ captionsReady: video.captionsReady });
});

module.exports = router;
