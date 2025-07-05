import React, { useState, useEffect } from "react";
import { getVideosByFolder } from "../api";
import { useNavigate } from "react-router-dom";

const FolderAccordion = ({ folder }) => {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  const toggleOpen = async () => {
    if (!open) {
      try {
        const res = await getVideosByFolder(folder._id);
        setVideos(res.data);
      } catch {
        setVideos([]);
      }
    }
    setOpen(!open);
  };

  return (
    <div className="mb-4 rounded border border-gray-300 bg-white text-black transition-colors">
      {/* Folder Header */}
      <div
        onClick={toggleOpen}
        className="flex justify-between items-center cursor-pointer p-4 rounded-t-lg 
                   bg-white text-black 
                   hover:bg-gray-100 transition-colors duration-300"
      >
        <h2 className="text-lg font-semibold">{folder.name}</h2>
        <span className="text-xl">{open ? "▲" : "▼"}</span>
      </div>

      {/* Folder Videos */}
      {open && (
        <div className="px-4 py-3 space-y-2 bg-gray-50 transition-colors duration-300">
          {videos.length === 0 ? (
            <p className="text-sm text-gray-600">
              No videos in this folder
            </p>
          ) : (
            videos.map((video) => (
              <div
                key={video._id}
                onClick={() =>
                  navigate(`/play/${folder.name}/${video._id}`, {
                    state: { folderId: folder._id },
                  })
                }
                className="p-3 rounded-md cursor-pointer 
                           bg-gray-100 hover:bg-gray-200 
                           text-black transition-colors duration-300"
              >
                <p className="font-medium">{video.name}</p>
                <p className="text-xs text-gray-600">
                  {video.size || "N/A"} • {video.duration || "N/A"} •{" "}
                  {video.captioned ? "✔" : "✖"}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FolderAccordion;
