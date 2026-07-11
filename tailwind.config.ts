import type { Config } from "tailwindcss";

// Phase 3: tokens adopted from the Claude Design system (see app/tokens.css).
// Utility color names map onto semantic CSS variables so every component themes
// across light ("paper") and dark ("carbon"); dark is the shipped default.
// Creative direction: "thermal receipt + delivery tracking" — quiet ink on warm
// receipt paper, with a single stamp-red accent spent in ONE place.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        page: "var(--surface-page)",
        card: "var(--surface-card)",
        sunken: "var(--surface-sunken)",
        raised: "var(--surface-raised)",
        overlay: "var(--overlay)",
        // Borders
        hairline: "var(--border-hairline)",
        perf: "var(--border-perf)", // dashed perforation / tear line
        // Text (namespaced under `fg` to avoid colliding with the fontSize scale
        // on the shared `text-` prefix, e.g. text-base size vs text-body color).
        fg: {
          DEFAULT: "var(--text-body)",
          strong: "var(--text-strong)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
          inverse: "var(--text-inverse)",
        },
        // Accent — the one bold color (stamps, key CTAs, route line)
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          wash: "var(--accent-wash)",
          contrast: "var(--accent-contrast)",
        },
        // Status (pending / in-transit)
        status: {
          transit: "var(--status-transit)",
          "transit-wash": "var(--status-transit-wash)",
        },
        // Raw carbon ramp — product image placeholder tiles reference it directly
        carbon: {
          900: "var(--carbon-900)",
          800: "var(--carbon-800)",
          700: "var(--carbon-700)",
          600: "var(--carbon-600)",
          500: "var(--carbon-500)",
        },
        // Raw receipt ramps — the /cart receipt is fixed-LIGHT in both themes and
        // references these directly (they don't flip with .theme-dark).
        paper: {
          "000": "var(--paper-000)",
          100: "var(--paper-100)",
          200: "var(--paper-200)",
          300: "var(--paper-300)",
          400: "var(--paper-400)",
        },
        ink: {
          900: "var(--ink-900)",
          800: "var(--ink-800)",
          700: "var(--ink-700)",
          600: "var(--ink-600)",
          500: "var(--ink-500)",
          400: "var(--ink-400)",
          300: "var(--ink-300)",
        },
        stamp: {
          700: "var(--stamp-700)",
          600: "var(--stamp-600)",
          500: "var(--stamp-500)",
          400: "var(--stamp-400)",
          100: "var(--stamp-100)",
        },
        thermal: "var(--thermal-fade)",
        ok: "#2f7d55",
        warn: "var(--status-transit)",
      },
      fontFamily: {
        sans: ["var(--font-display)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        // Design system scale (px): 11/12/13/15/17/20/24/30/38/48/62/80
        "2xs": ["11px", { lineHeight: "1.3" }],
        xs: ["12px", { lineHeight: "1.4" }],
        sm: ["13px", { lineHeight: "1.45" }],
        base: ["15px", { lineHeight: "1.5" }],
        md: ["17px", { lineHeight: "1.4" }],
        lg: ["20px", { lineHeight: "1.3" }],
        xl: ["24px", { lineHeight: "1.25" }],
        "2xl": ["30px", { lineHeight: "1.15" }],
        "3xl": ["38px", { lineHeight: "1.08" }],
        "4xl": ["48px", { lineHeight: "1.04" }],
        "5xl": ["62px", { lineHeight: "1.02" }],
        "6xl": ["80px", { lineHeight: "1" }],
      },
      letterSpacing: {
        label: "0.14em", // mono eyebrow / stamp labels (uppercased)
      },
      borderRadius: {
        // receipts are crisp — keep radii low (design: 0/2/4/8/pill)
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "8px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
