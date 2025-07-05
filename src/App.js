import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UploadPage from "./pages/UploadPage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./context/ThemeContext";

const App = () => (
  <ThemeProvider>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/play/:folderName/:videoId" element={<VideoPlayerPage />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);


export default App;
