import type { Config } from "tailwindcss";

// Phase 1: design.md tokens wired into theme.extend.
// Creative direction: "thermal receipt + delivery tracking" — quiet ink on warm
// receipt paper, with a single stamp-red accent spent in ONE place (stamps / route line).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#E9E6DC", // primary surface (receipt paper)
        "paper-2": "#F3F1EA", // raised surface
        ink: "#18181B", // primary text
        "ink-faded": "#7C766B", // secondary text / faded thermal print
        stamp: "#A81F2D", // the one bold accent — stamps, key CTAs, route line
        rule: "rgba(24,24,27,0.15)", // dashed perforation / route lines
        ok: "#2F7D55",
        warn: "#E0A82E",
      },
      fontFamily: {
        // Body defaults to the display sans (D4); mono is applied explicitly on
        // receipt/tracking text (prices, order IDs, ETAs, status lines).
        sans: ["var(--font-display)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        // design.md scale: 12 / 14 / 16 / 20 / 28 / 40 / 56 (px)
        micro: ["0.75rem", { lineHeight: "1rem" }], // 12
        label: ["0.875rem", { lineHeight: "1.25rem" }], // 14
        body: ["1rem", { lineHeight: "1.5rem" }], // 16
        lg: ["1.25rem", { lineHeight: "1.75rem" }], // 20
        h3: ["1.75rem", { lineHeight: "2rem" }], // 28
        h2: ["2.5rem", { lineHeight: "2.75rem" }], // 40
        h1: ["3.5rem", { lineHeight: "3.75rem" }], // 56
      },
      borderRadius: {
        // receipts are crisp — keep radii small
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      // spacing: none added — design's 4/8/12/16/24/32/48/64 already map to
      // Tailwind's default 1,2,3,4,6,8,12,16.
    },
  },
  plugins: [],
};

export default config;
