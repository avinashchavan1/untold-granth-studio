/** @type {import('tailwindcss').Config} */
import { readFileSync } from "node:fs";

// The app's look comes from channel.json → brand.app_theme (colors, fonts); anything missing keeps these defaults.
const DEFAULT = {
  fonts: {
    display: ['"Cinzel"', "Georgia", "serif"],
    sans: ['"Mukta"', '"Noto Sans Devanagari"', "system-ui", "sans-serif"],
  },
  colors: {
    ink: { DEFAULT: "#1d1a2e", soft: "#6a6478" },
    night: { 950: "#0b0a18", 900: "#12102a", 800: "#1b1838", 700: "#2a2550", 600: "#3b3570" },
    gold: { DEFAULT: "#e6b450", deep: "#a8741a", soft: "#f5e4bd" },
    parchment: { DEFAULT: "#f6f1e6", deep: "#ece3cf" },
    vermilion: "#c8341e",
  },
};
let theme = {};
try { theme = JSON.parse(readFileSync(new URL("./channel.json", import.meta.url), "utf8")).brand?.app_theme ?? {}; } catch { /* defaults */ }
const merge = (a, b) => Object.fromEntries(Object.keys({ ...a, ...b }).map((k) =>
  [k, a[k] && b[k] && typeof a[k] === "object" && !Array.isArray(a[k]) ? { ...a[k], ...b[k] } : b[k] ?? a[k]]));

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        display: theme.fonts?.display ?? DEFAULT.fonts.display,
        sans: theme.fonts?.sans ?? DEFAULT.fonts.sans,
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: { ...merge(DEFAULT.colors, theme.colors ?? {}), ...(theme.palettes ?? {}) },   // palettes: replace stock Tailwind scales (amber, emerald…) with brand ones
    },
  },
  plugins: [],
};
