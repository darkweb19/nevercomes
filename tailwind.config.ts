import type { Config } from "tailwindcss";

// Phase 1 wires the design.md tokens into theme.extend (colors, fonts, spacing, radius).
// Keep this empty until then — do not invent tokens here.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
