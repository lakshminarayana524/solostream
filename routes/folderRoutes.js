//routes/folderRouters
const express = require("express");
const router = express.Router();
const Folder = require("../models/Folder");
const Video = require("../models/Video");

// Hardcoded delete password
const DELETE_PASSWORD = "admin123";

// GET /api/folders
router.get("/", async (req, res) => {
  try {
    const folders = await Folder.find().populate("videos");
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});

// POST /api/folders
router.post("/", async (req, res) => {
  try {
    const folder = new Folder({ name: req.body.name });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ error: "Failed to create folder" });
  }
});

router.get("/name/:name", async (req, res) => {
  try {
    const folder = await Folder.findOne({ name: req.params.name });
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    res.json(folder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// DELETE /api/folders/:folderId
router.delete("/:folderId", async (req, res) => {

  const { folderId } = req.params;

  try {
    const folder = await Folder.findById(folderId).populate("videos");

    if (!folder) return res.status(404).json({ error: "Folder not found" });

    // Delete all videos inside folder
    for (const video of folder.videos) {
      const filePath = path.join(__dirname, "..", "uploads", path.basename(video.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await Video.findByIdAndDelete(video._id);
    }

    // Delete folder
    await Folder.findByIdAndDelete(folderId);

    res.json({ message: "Folder and its videos deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

module.exports = router;
