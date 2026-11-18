/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cinzel"', "Georgia", "serif"],
        sans: ['"Mukta"', '"Noto Sans Devanagari"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: { DEFAULT: "#1d1a2e", soft: "#6a6478" },
        night: { 950: "#0b0a18", 900: "#12102a", 800: "#1b1838", 700: "#2a2550", 600: "#3b3570" },
        gold: { DEFAULT: "#e6b450", deep: "#a8741a", soft: "#f5e4bd" },
        parchment: { DEFAULT: "#f6f1e6", deep: "#ece3cf" },
        vermilion: "#c8341e",
      },
    },
  },
  plugins: [],
};
