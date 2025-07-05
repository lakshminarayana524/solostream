import React from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-5 border-b border-gray-700 bg-white dark:bg-black dark:text-white shadow-md">
      {/* Left Section: Logo */}
      <h1>
        <Link to="/" className="text-2xl font-bold tracking-wide">
          SoloStream
        </Link>
      </h1>

      {/* Right Section: Theme Toggle + Upload Button */}
      <div className="flex gap-5 items-center">
        <ThemeToggle />
        <Link
          to="/upload"
          className="px-4 py-1 rounded bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-300 transition"
        >
          Upload
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
