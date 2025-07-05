import React from "react";
import "./Loader.css"; // place CSS here or use Tailwind if preferred

const Loader = () => (
  <div className="w-full flex justify-center items-center py-10">
    <div className="loader">
      {[...Array(12)].map((_, i) => (
        <div key={i} className={`bar${i + 1}`}></div>
      ))}
    </div>
  </div>
);

export default Loader;
