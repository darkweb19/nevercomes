"use client";

/**
 * TrackerTeaser — the fake order card shown in the Hero section.
 *
 * Renders a self-contained Card with:
 *  - Header row: ORDER #NC-4471 + StatusPill "IN TRANSIT"
 *  - 400×300 SVG map (fixed bezier route, glow, grid, SMIL courier animation)
 *  - ETA chip (top-left) composing <EtaTicker>
 *  - Faint NEVER ARRIVED stamp (bottom-right, opacity 0.42)
 *  - Courier footer: DR avatar · Dev R. · YOUR COURIER · ⋆ 4.9 · CLOSE · $0.00
 *
 * Reduced-motion: SMIL <animate>/<animateMotion> are gated behind a mounted +
 * !reduce check, matching the TrackerMap idiom (window.matchMedia detected once
 * on mount). SSR / first hydration frame shows the courier at rest at ~74%:
 * approximately (232, 78) along the spec route, computed from the keyPoints range.
 *
 * The SVG is aria-hidden (decorative — the order status is conveyed in the
 * surrounding card text and StatusPill).
 */

import { useSyncExternalStore } from "react";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Stamp } from "@/components/ui/Stamp";
import { EtaTicker } from "./EtaTicker";

/** Path shared by the dashed route, travelled overlay, and animateMotion. */
const ROUTE_PATH =
  "M 36 270 C 110 250, 88 180, 150 158 S 250 128, 232 78 S 300 58, 360 36";

/**
 * Static courier position at ~74% of the route.
 * Derived from the spec keyPoints (0.76 → nearest fixed display point ≈ 74%).
 * Used for the SSR frame and when prefers-reduced-motion is active.
 */
const STATIC_COURIER = { x: 232, y: 78 };

/** Subscribe to prefers-reduced-motion changes (useSyncExternalStore contract). */
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function TrackerTeaser() {
  // Server snapshot is `false` (no SMIL in SSR HTML / first hydration frame —
  // the courier renders parked); the client snapshot flips motion on only when
  // the user does not prefer reduced motion. Same idiom as useCartReady.
  const showMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  return (
    <Card
      raised
      padded={false}
      className="overflow-hidden w-full"
    >
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-[18px] py-[14px]"
        style={{ borderBottom: "1px solid var(--border-hairline)" }}
      >
        <span className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
          ORDER #NC-4471
        </span>
        <StatusPill variant="transit" pulse={showMotion} />
      </div>

      {/* ── Map area ───────────────────────────────────────────────────── */}
      {/* The night map is fixed-dark in both themes (like the fixed-light
          receipt); force .theme-dark so semantic text/border tokens inside
          (YOU label, ETA chip) stay readable when the page is light. */}
      <div className="theme-dark relative h-[300px] bg-carbon-800">
        <svg
          viewBox="0 0 400 300"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          style={{ display: "block" }}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/* Grid pattern */}
            <pattern
              id="ncTeaserGrid"
              width="46"
              height="46"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M46 0H0V46"
                fill="none"
                stroke="var(--carbon-600)"
                strokeWidth="1"
              />
            </pattern>
            {/* Warm glow from destination area */}
            <radialGradient id="ncTeaserGlow" cx="82%" cy="16%" r="72%">
              <stop offset="0%" stopColor="rgba(200,70,58,0.22)" />
              <stop offset="100%" stopColor="rgba(200,70,58,0)" />
            </radialGradient>
          </defs>

          {/* Base fill */}
          <rect width="400" height="300" fill="var(--carbon-800)" />
          {/* Grid */}
          <rect width="400" height="300" fill="url(#ncTeaserGrid)" />

          {/* Arterials */}
          <g
            stroke="var(--carbon-500)"
            strokeWidth="2.5"
            opacity="0.85"
            strokeLinecap="round"
          >
            <line x1="0" y1="120" x2="400" y2="120" />
            <line x1="244" y1="0" x2="244" y2="300" />
            <path
              d="M 0 248 C 120 232, 210 206, 400 224"
              fill="none"
            />
          </g>

          {/* Glow overlay */}
          <rect width="400" height="300" fill="url(#ncTeaserGlow)" />

          {/* Route — full faint dashed (the whole path) */}
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="var(--carbon-500)"
            strokeWidth="3"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
          {/* Route — travelled portion (stamp-red, ~74%) */}
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="var(--stamp-500)"
            strokeWidth="3"
            strokeDasharray="0.74 1"
            pathLength="1"
            strokeLinecap="round"
          />

          {/* Destination — YOU */}
          <g transform="translate(360 36)">
            <circle
              r="13"
              fill="var(--carbon-900)"
              stroke="var(--stamp-500)"
              strokeWidth="2.5"
            />
            <circle r="4.5" fill="var(--stamp-500)" />
            <text
              x="0"
              y="-21"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontWeight="700"
              fontSize="11"
              letterSpacing="2"
              fill="var(--text-strong)"
            >
              YOU
            </text>
          </g>

          {/* Origin square */}
          <g transform="translate(36 270)">
            <rect
              x="-7"
              y="-7"
              width="14"
              height="14"
              rx="2"
              fill="var(--carbon-900)"
              stroke="var(--text-faint)"
              strokeWidth="2"
            />
          </g>

          {/* Courier dot — animated (motion) or static (reduced / SSR) */}
          <g
            transform={
              showMotion
                ? undefined
                : `translate(${STATIC_COURIER.x} ${STATIC_COURIER.y})`
            }
          >
            {/* Pulse ring — SMIL, only when motion is allowed */}
            {showMotion && (
              <circle r="16" fill="rgba(200,70,58,0.16)">
                <animate
                  attributeName="r"
                  values="12;20;12"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.45;0;0.45"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Dot body */}
            <circle
              r="9"
              fill="var(--stamp-500)"
              stroke="var(--paper-000)"
              strokeWidth="2"
            />
            {/* Send-arrow courier glyph */}
            <path
              d="m3 11 19-9-9 19-2-8-8-2z"
              transform="translate(-5.6 -5.6) scale(0.48)"
              fill="var(--paper-000)"
              stroke="var(--paper-000)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* SMIL path crawl — only when motion is allowed */}
            {showMotion && (
              <animateMotion
                dur="6s"
                repeatCount="indefinite"
                calcMode="linear"
                keyPoints="0.76;0.7;0.78;0.73;0.8;0.74;0.79;0.76"
                keyTimes="0;0.15;0.3;0.45;0.6;0.75;0.9;1"
                path={ROUTE_PATH}
              />
            )}
          </g>
        </svg>

        {/* ── ETA chip ─────────────────────────────────────────────────── */}
        <div
          className="absolute left-4 top-4"
          style={{
            background: "var(--carbon-900)",
            border: "1.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-2, 4px)",
            padding: "9px 13px",
            boxShadow: "var(--shadow-lift, 0 2px 8px rgba(0,0,0,0.32))",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.16em",
              color: "var(--text-muted)",
              fontWeight: 700,
            }}
          >
            EST. ARRIVAL
          </div>
          <EtaTicker />
        </div>

        {/* ── Faint NEVER ARRIVED stamp ─────────────────────────────────── */}
        <div className="absolute right-[14px] bottom-[18px]" style={{ opacity: 0.42 }}>
          <Stamp label="NEVER ARRIVED" />
        </div>
      </div>

      {/* ── Courier footer ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-[13px] px-[18px] py-[14px]"
        style={{ borderTop: "1px solid var(--border-hairline)" }}
      >
        {/* Avatar */}
        <span
          className="flex-none w-10 h-10 rounded-pill flex items-center justify-center font-mono font-bold text-fg-strong text-sm"
          style={{
            background: "var(--surface-raised)",
            border: "2px solid var(--border-perf)",
          }}
          aria-hidden="true"
        >
          DR
        </span>

        {/* Courier info */}
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[15px] text-fg-strong">
            Dev R.
          </div>
          <div className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted mt-px">
            YOUR COURIER · ⋆ 4.9 · CLOSE
          </div>
        </div>

        {/* Price */}
        <span className="font-mono text-2xs font-bold uppercase tracking-label text-fg-faint">
          $0.00
        </span>
      </div>
    </Card>
  );
}
