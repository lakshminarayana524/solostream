import React, { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const lightIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="white"
      className="w-6 h-6"
    >
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.8" />
      <line x1="12" y1="2" x2="12" y2="5" stroke="white" strokeLinecap="round" strokeWidth="1.8" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeLinecap="round" strokeWidth="1.8" />
      <line x1="2" y1="12" x2="5" y2="12" stroke="white" strokeLinecap="round" strokeWidth="1.8" />
      <line x1="19" y1="12" x2="22" y2="12" stroke="white" strokeLinecap="round" strokeWidth="1.8" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="white" strokeLinecap="round" strokeWidth="1.8" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="white" strokeLinecap="round" strokeWidth="1.8" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="white" strokeLinecap="round" strokeWidth="1.8" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="white" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );



  const darkIcon = (
    <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA8UlEQVR4nOXVvS4EURiH8R+RLVwGjdI9aGV9RFyCTq3WSgT9dhIbd6CXUGiFBitKqi0oHZnkFLKZmZ2deQuJN/mX53nO53v4D9VDH5d4wBh3UfA+Rki/8o61ruA5HE+Ai3xgOWLmZyXwhI0I+HYF/CYCvlCy5ylnL0KwWwFPWIkQnNcIehGC5wr4d96+zjWuWcFShOCrRrAfIXisEbxhsatgWCNIGHQVbE4RJJxgvq2guIqvDSTXWI1uFakktzjCAQ5xlTO1TmeQpIkUYxu16zaSwawPcgsvDcCj/Dm1PvgdXOAJn/nF3+fetR7Vp/5m/QB/b5/KpJwUPQAAAABJRU5ErkJggg=="
      alt="dark-mode"
      className="w-6 h-6"
    />
  );

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? lightIcon : darkIcon}
    </button>
  );
};

export default ThemeToggle;
