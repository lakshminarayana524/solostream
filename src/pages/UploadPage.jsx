import React, { useEffect, useState } from "react";
import { getFolders, createFolder, uploadVideoSingle } from "../api";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader.jsx";

const UploadPage = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({});
  const [uploadMeta, setUploadMeta] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [folderWarning, setFolderWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchFolders();
  }, []);

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

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb > 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
  };

  const handleCreateFolder = async () => {
    if (!newFolder.trim()) return;
    const res = await createFolder(newFolder.trim());
    setNewFolder("");
    setShowFolderModal(false);
    await fetchFolders();
    setSelectedFolder(res.data._id);
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const existing = new Set([...files.map((f) => f.name)]);
    const filtered = [];
    const dupes = [];

    selected.forEach((f) => {
      if (!existing.has(f.name)) {
        filtered.push(f);
        existing.add(f.name);
      } else {
        dupes.push(f.name);
      }
    });

    if (dupes.length > 0) {
      setDuplicateWarning(`Skipped duplicates: ${dupes.join(", ")}`);
      setTimeout(() => setDuplicateWarning(""), 2000);
    }

    setFiles((prev) => [...prev, ...filtered]);
  };

  const handleRemoveFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleUpload = async () => {
    if (!selectedFolder) {
      setFolderWarning(true);
      setTimeout(() => setFolderWarning(false), 3000);
      return;
    }

    if (!files.length) return;

    const queue = [...files];
    const concurrency = 4;
    const uploads = [];

    const runner = async () => {
      const file = queue.shift();
      if (!file) return;
      const formData = new FormData();
      formData.append("videos", file);
      const startTime = Date.now();
      let lastLoaded = 0;

      await uploadVideoSingle(selectedFolder, formData, {
        onUploadProgress: (e) => {
          const now = Date.now();
          const loadedPct = Math.round((e.loaded * 100) / e.total);
          const deltaLoaded = e.loaded - lastLoaded;
          const secs = (now - startTime) / 1000;
          const speedMB = (deltaLoaded / secs) / (1024 * 1024);
          const eta = (e.total - e.loaded) / (deltaLoaded / secs);

          lastLoaded = e.loaded;
          setProgress((prev) => ({ ...prev, [file.name]: loadedPct }));
          setUploadMeta((prev) => ({
            ...prev,
            [file.name]: {
              speed: `${speedMB.toFixed(2)} MB/s`,
              eta: `${eta.toFixed(1)}s`
            }
          }));
        }
      });

      setFiles((prev) => prev.filter((f) => f.name !== file.name));
      await runner();
    };

    for (let i = 0; i < concurrency; i++) uploads.push(runner());
    await Promise.all(uploads);
  };

  return (
    <div className="p-6 pt-20 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-all">
      <button onClick={() => navigate("/")} className="mb-6 hover:underline">⬅ Back</button>

      {loading && <Loader />}

      {duplicateWarning && (
        <div className="bg-yellow-300 text-black p-2 rounded mb-4">
          {duplicateWarning}
        </div>
      )}

      {folderWarning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-red-500 text-white px-6 py-3 rounded shadow-lg">
            Please select a folder before uploading
          </div>
        </div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-lg mb-4">New Folder Name</h2>
            <input
              type="text"
              className="w-full p-2 border rounded mb-4 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="Folder name"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700">Cancel</button>
              <button onClick={handleCreateFolder} className="px-4 py-2 rounded bg-black text-white dark:bg-white dark:text-black">Add</button>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="mx-auto max-w-xl space-y-4">
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="w-full p-2 rounded bg-gray-100 dark:bg-white dark:text-black"
          >
            <option value="">-- Select Folder --</option>
            {folders.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFolderModal(true)}
            className="w-full p-2 rounded bg-black text-white dark:bg-white dark:text-black"
          >
            + Add Folder
          </button>

          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileChange}
            className="w-full"
          />

          <div className={`border p-2 rounded ${files.length > 5 ? "max-h-80 overflow-y-auto" : ""}`}>
            {files.map(file => (
              <div key={file.name} className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                  <div className="w-full bg-gray-300 h-2 rounded mt-1">
                    <div
                      className="bg-green-500 h-2 transition-all"
                      style={{ width: `${progress[file.name] || 0}%` }}
                    />
                  </div>
                  {uploadMeta[file.name] && (
                    <p className="text-xs text-gray-400 mt-1">
                      ⏱ {uploadMeta[file.name].eta} &nbsp; 🚀 {uploadMeta[file.name].speed}
                    </p>
                  )}
                </div>
                <button onClick={() => handleRemoveFile(file.name)} className="text-red-600 text-xl font-bold">✕</button>
              </div>
            ))}
          </div>

          <button
            disabled={!files.length}
            onClick={handleUpload}
            className="w-full p-2 rounded bg-black text-white dark:bg-white dark:text-black"
          >
            Upload Videos
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
