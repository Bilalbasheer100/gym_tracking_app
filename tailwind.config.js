/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0c",
        surface: "#141418",
        surface2: "#1d1d23",
        line: "#2a2a32",
        muted: "#8a8a96",
        accent: "#4f8cff",
        cal: "#4f8cff",
        protein: "#ff5d73",
        carbs: "#ffb020",
        fat: "#9b6bff",
        good: "#2fd27a",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
