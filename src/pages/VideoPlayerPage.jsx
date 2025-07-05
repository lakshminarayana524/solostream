import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {getVideoStreamUrl , getFolderName ,getVideosByFolder , getVideoCaptions} from "../api";
import Loader from "../components/Loader.jsx";

const EXPIRY_DURATION = 7200;

const VideoPlayerPage = () => {
  const { videoId, folderName } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const sidebarRef = useRef(null);

  const [url, setUrl] = useState(null);
  const [captionUrl, setCaptionUrl] = useState(null);
  const [showCaptions, setShowCaptions] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [videos, setVideos] = useState([]);
  const [remainingTime, setRemainingTime] = useState(EXPIRY_DURATION);
  const [showControls, setShowControls] = useState(true);
  const [folderId, setFolderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFolderId = async () => {
      try {
        const {data} = await getFolderName(folderName);
        setFolderId(data._id);
        // const { data } = await axios.get(`http://localhost:5000/api/folders/name/${folderName}`);
        // setFolderId(data._id);
        localStorage.setItem("currentFolderId", data._id);
      } catch (err) {
        console.error("Failed to get folderId from folderName", err);
      }
    };
    fetchFolderId();
  }, [folderName]);

  useEffect(() => {
    if (folderId && videoId) {
      loadVideoAndCaptions(folderId);
    }
  }, [folderId, videoId]);

  const loadVideoAndCaptions = async (folderId) => {
    setLoading(true);
    try {

      const { data:videoRes } = await getVideoStreamUrl(videoId);
    

      // const { data: videoRes } = await axios.get(`http://localhost:5000/api/videos/stream/${videoId}`);
      setUrl(videoRes.url);

      setRemainingTime(EXPIRY_DURATION);

      const { data : captionRes } = await getVideoCaptions(videoId);
      setCaptionUrl(captionRes.captionUrl);

      // const { data: captionRes } = await axios.get(`http://localhost:5000/api/videos/captions/${videoId}`);
      // setCaptionUrl(captionRes.captionUrl);

      const { data: allVideos} = await getVideosByFolder(folderId);

      // const { data: allVideos } = await axios.get(`http://localhost:5000/api/videos/folder/${folderId}`);
      const sorted = [...allVideos].sort((a, b) => a.name.localeCompare(b.name));
      setVideos(sorted);

      const scrollY = localStorage.getItem("sidebar-scroll");
      if (scrollY && sidebarRef.current) {
        sidebarRef.current.scrollTop = parseInt(scrollY);
      }
    } catch (err) {
      console.error("Failed to load video or captions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!url) return;
    const interval = setInterval(() => {
      setRemainingTime((time) => {
        if (time <= 1) {
          refreshPresignedURL();
          return EXPIRY_DURATION;
        }
        return time - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [url]);

  const refreshPresignedURL = async () => {
    try {
      const { data: videoRes } = await getVideoStreamUrl(videoId);

      // const { data: videoRes } = await axios.get(`http://localhost:5000/api/videos/stream/${videoId}`);
      const currentTime = videoRef.current?.currentTime || 0;
      const wasPaused = videoRef.current?.paused;
      setUrl(videoRes.url);

      const waitAndResume = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
          if (!wasPaused) {
            videoRef.current.play().catch((e) => {
              console.warn("Playback interrupted:", e.message);
            });
          }
          videoRef.current.removeEventListener("loadedmetadata", waitAndResume);
        }
      };

      if (videoRef.current) {
        videoRef.current.addEventListener("loadedmetadata", waitAndResume);
      }
    } catch (err) {
      console.error("Error refreshing pre-signed URL:", err);
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  };

  const handleSpeed = (e) => {
    const speed = parseFloat(e.target.value);
    setPlaybackRate(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
  };

  const handleVolume = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) videoRef.current.volume = vol;
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((val) => String(val).padStart(2, "0")).join(":");
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        videoRef.current?.paused ? videoRef.current.play() : videoRef.current.pause();
      }
      if (e.code === "ArrowLeft") skipTime(-10);
      if (e.code === "ArrowRight") skipTime(10);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSidebarScroll = () => {
    if (sidebarRef.current) {
      localStorage.setItem("sidebar-scroll", sidebarRef.current.scrollTop);
    }
  };

  const handleVideoEnded = () => {
    const completed = JSON.parse(localStorage.getItem("completedVideos") || "[]");
    if (!completed.includes(videoId)) {
      completed.push(videoId);
      localStorage.setItem("completedVideos", JSON.stringify(completed));
    }

    const currentIndex = videos.findIndex((v) => v._id === videoId);
    if (currentIndex !== -1 && currentIndex < videos.length - 1) {
      const nextVideo = videos[currentIndex + 1];
      navigate(`/play/${encodeURIComponent(folderName)}/${nextVideo._id}`);
    }
  };

  return (
    <div className="flex h-screen pt-20 bg-white text-black dark:bg-black dark:text-white transition-all">
      <div
        ref={sidebarRef}
        onScroll={handleSidebarScroll}
        className="w-72 h-full overflow-y-auto bg-gray-100 dark:bg-gray-900"
      >
        <div className="sticky top-0 bg-gray-100 dark:bg-gray-900 p-4 z-10">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-100 text-black dark:bg-gray-900 dark:text-white hover:underline mb-2"
          >
            ⬅ Back
          </button>
          <h2 className="text-xl font-bold">{decodeURIComponent(folderName)}</h2>
        </div>
        <ul className="space-y-2 p-4 pt-0">
          {videos.map((vid) => {
            const completed = JSON.parse(localStorage.getItem("completedVideos") || "[]");
            const isCompleted = completed.includes(vid._id);
            return (
              <li
                key={vid._id}
                onClick={() => navigate(`/play/${encodeURIComponent(folderName)}/${vid._id}`)}
                className={`cursor-pointer px-3 py-2 rounded-lg flex justify-between items-center hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors ${
                  vid._id === videoId ? "bg-gray-300 dark:bg-gray-700 font-semibold" : ""
                }`}
              >
                <span>{vid.name}</span>
                {isCompleted && <span className="text-green-500 ml-2">✓</span>}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Video Player Section */}
      <div className="flex-1 p-6 flex flex-col items-center relative overflow-hidden">
        {loading ? (
          <Loader />
        ) : url ? (
          <div
            className="w-full max-w-5xl relative"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <video
              ref={videoRef}
              src={url}
              controls={showControls}
              autoPlay
              onEnded={handleVideoEnded}
              className="w-full rounded-lg shadow-lg"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.volume = volume;
                  videoRef.current.playbackRate = playbackRate;
                }
              }}
            >
              {captionUrl && showCaptions && (
                <track label="English" kind="subtitles" srcLang="en" src={captionUrl} default />
              )}
            </video>
            <div
              className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-3 py-1 rounded cursor-help"
              title={`Pre-signed URL expires in ${formatTime(remainingTime)}`}
            >
              ⏳ {formatTime(remainingTime)}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Video failed to load.</p>
        )}

        {/* Playback Controls */}
        {!loading && url && (
          <div className="flex flex-wrap gap-4 mt-6 items-center justify-center">
            <div className="flex gap-2">
              <button onClick={() => skipTime(-10)} className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700">
                ⏪ 10s
              </button>
              <button onClick={() => skipTime(10)} className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700">
                10s ⏩
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label>Speed</label>
              <select
                onChange={handleSpeed}
                value={playbackRate}
                className="text-black dark:text-black bg-white dark:bg-white rounded px-2 py-1"
              >
                {[1, 1.25, 1.5, 2, 2.5, 3].map((s) => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label>Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolume}
                className="w-32"
              />
            </div>

            {captionUrl && (
              <button
                onClick={() => setShowCaptions((prev) => !prev)}
                className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
              >
                {showCaptions ? "Hide Captions" : "Show Captions"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerPage;
