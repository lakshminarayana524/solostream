import React, { useEffect, useState } from "react";
import { getFolders, getVideosByFolder, deleteFolder, deleteVideo } from "../api";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader.jsx";

const formatSize = (bytes) => !bytes || isNaN(bytes) ? "N/A" : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "N/A";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return [hrs > 0 ? `${hrs}h` : "", mins > 0 ? `${mins}m` : "", secs > 0 && hrs === 0 ? `${secs}s` : ""].filter(Boolean).join(" ");
};

const HomePage = () => {
  const [folders, setFolders] = useState([]);
  const [openFolders, setOpenFolders] = useState({});
  const [videos, setVideos] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchFolders(); }, []);

  const fetchFolders = async () => {
    try {
      const res = await getFolders();
      setFolders(res.data);
    } catch {
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = async (folderId) => {
    const isOpen = openFolders[folderId];
    setOpenFolders(prev => ({ ...prev, [folderId]: !isOpen }));
    if (!isOpen) {
      try {
        const res = await getVideosByFolder(folderId);
        const sorted = res.data.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );
        setVideos(prev => ({ ...prev, [folderId]: sorted }));
      } catch {
        setVideos(prev => ({ ...prev, [folderId]: [] }));
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id, name } = deleteTarget;
    const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, "");
    if (normalize(confirmName) !== normalize(name)) {
      setError("Name does not match.");
      return;
    }

    try {
      if (type === "folder") {
        await deleteFolder(id);
        await fetchFolders();
        setVideos(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      } else if (type === "video") {
        await deleteVideo(id);
        setVideos(prev => {
          const updated = { ...prev };
          updated[deleteTarget.folderId] = updated[deleteTarget.folderId].filter(
            (v) => v._id !== id
          );
          return updated;
        });
      }
      closeDeletePopup();
    } catch {
      setError("Deletion failed. Try again.");
    }
  };

  const openDeletePopup = (type, id, name, folderId = null) => {
    setDeleteTarget({ type, id, name, folderId });
    setConfirmName("");
    setError("");
  };

  const closeDeletePopup = () => {
    setDeleteTarget(null);
    setConfirmName("");
    setError("");
  };

  return (
    <div className="min-h-screen pt-40 flex justify-center bg-white text-black dark:bg-black dark:text-white transition-colors">
      <div className="w-full max-w-3xl space-y-6">
        {loading ? <Loader /> : (
          folders.length === 0 ? (
            <p className="text-center text-gray-400">No files available</p>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => {
                    localStorage.removeItem("completedVideos");
                    window.location.reload();
                  }}
                  className="text-sm text-blue-500 underline"
                >
                  Clear Watched History
                </button>
              </div>

              {folders.map((folder) => (
                <div key={folder._id} className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-900 transition-colors">
                  <div className="flex justify-between items-center cursor-pointer">
                    <div onClick={() => toggleFolder(folder._id)} className="flex-1 flex justify-between">
                      <h2 className="text-lg font-semibold">{folder.name}</h2>
                      <span className="text-xl">{openFolders[folder._id] ? "▲" : "▼"}</span>
                    </div>
                    <button
                      onClick={() => openDeletePopup("folder", folder._id, folder.name)}
                      className="text-red-600 ml-4 font-bold text-xl"
                      title="Delete Folder"
                    >
                      ✕
                    </button>
                  </div>

                  {openFolders[folder._id] && videos[folder._id] && (
                    <div className={`mt-4 space-y-3 overflow-y-auto ${videos[folder._id].length > 10 ? "max-h-[420px]" : ""}`}>
                      {videos[folder._id].length === 0 ? (
                        <p className="text-gray-400">No videos in this folder</p>
                      ) : (
                        videos[folder._id].map((video) => {
                          const completed = JSON.parse(localStorage.getItem("completedVideos") || "[]");
                          const isCompleted = completed.includes(video._id);
                          return (
                            <div key={video._id} className="p-3 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex justify-between items-center">
                              <div
                                onClick={() => navigate(`/play/${encodeURIComponent(folder.name)}/${video._id}`, {
                                  state: { folderId: folder._id }
                                })}
                                className="cursor-pointer flex-1"
                              >
                                <p className="font-medium flex items-center gap-2">
                                  {video.name}
                                  {isCompleted && <span className="text-green-500" title="Completed">✓</span>}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatSize(video.size)} | {formatDuration(video.duration)} |{" "}
                                  {video.captionsReady ? "Captioned" : "No captions"}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  openDeletePopup("video", video._id, video.name, folder._id)
                                }
                                className="text-red-600 ml-4 font-bold text-xl"
                                title="Delete Video"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-2 text-black dark:text-white">Confirm Deletion</h3>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
              Please enter the <span className="font-semibold">{deleteTarget.type}</span> name:{" "}
              <span className="italic">"{deleteTarget.name}"</span>
            </p>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Enter exact name"
              className="w-full p-2 mb-3 rounded bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
            />
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={closeDeletePopup} className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-black dark:text-white">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
