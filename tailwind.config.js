module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // ✅ VERY IMPORTANT
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-scrollbar"),
    require("autoprefixer"), // ✅ can be kept here
  ],
};
