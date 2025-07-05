// api.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API; // replace if different
// console.log("API_BASE:", process.env.REACT_APP_API);


// ✅ Add this
export const uploadVideoSingle = (folderId, formData, config = {}) => {
  return axios.post(`${API_BASE}/videos/upload/${folderId}`, formData, config);
};

// Existing exports
export const getFolders = () => axios.get(`${API_BASE}/folders`);

export const createFolder = (name) =>
  axios.post(`${API_BASE}/folders`, { name });

export const uploadVideos = (folderId, formData) =>
  axios.post(`${API_BASE}/videos/upload/${folderId}`, formData);

export const getVideosByFolder = (folderId) =>
  axios.get(`${API_BASE}/videos/folder/${folderId}`);

export const getFolderName =(folderName) =>
  axios.get(`${API_BASE}/folders/name/${folderName}`);

export const deleteVideo = (videoId) =>
  axios.delete(`${API_BASE}/videos/${videoId}`);

export const deleteFolder = (folderId) =>
  axios.delete(`${API_BASE}/folders/${folderId}`);

export const getVideoStreamUrl = (videoId) =>
  axios.get(`${API_BASE}/videos/stream/${videoId}`);

export const getVideoCaptions = (videoId)=>
  axios.get(`${API_BASE}/videos/captions/${videoId}`);


