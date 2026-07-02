"use client";

/**
 * TrackerMap — the stylised SVG map for the order tracker.
 *
 * A deliberately thermal-print-flavoured SVG (carbon street grid, stamp-red
 * dashed route, glowing origin) rather than real map tiles. Real OSRM routing
 * is a later phase (D1); for v1 the route is a fixed SVG bezier (WIDE_ROUTE)
 * and `progress` maps to a position on that path via getPointAtLength.
 *
 * No pinDrift, dim, mode, or redraw — those are recede/fade design explorations
 * that are out of v1 scope (D2). Static variant is handled by the parent
 * (TrackingView) withholding the rAF loop; this component renders whatever
 * `progress` it receives.
 */

import { useEffect, useRef, useState } from "react";

/**
 * The wide landscape bezier route — sits in the central band of the 1000×640
 * viewBox so it survives aspect-ratio slice-crop on narrow viewports.
 * Origin: (150, 478) · Destination: (886, 214)
 */
const WIDE_ROUTE =
  "M 150 478 C 290 470, 312 384, 432 374 S 588 360, 606 280 S 766 250, 726 188 S 846 168, 886 214";

export interface TrackerMapProps {
  /** Fraction along the route, 0–PROGRESS_CAP. Drives courier position. */
  progress: number;
  /** When true, suppress the SMIL pulse ring (prefers-reduced-motion path). */
  reduce: boolean;
  /** Vendor / origin label displayed above the origin square (uppercased). */
  vendorLabel: string;
}

/**
 * The thermal-print SVG map used on the desktop tracker.
 *
 * Courier position is computed via getPointAtLength on the WIDE_ROUTE path.
 * The path ref is measured on mount; position is re-derived on every `progress`
 * change (driven by the rAF loop or 5s interval in TrackingView).
 */
export function TrackerMap({ progress, reduce, vendorLabel }: TrackerMapProps) {
  const pathRef = useRef<SVGPathElement>(null);
  // Total path length — measured once on mount.
  const [len, setLen] = useState(1);
  // Current courier SVG coordinate.
  const [pt, setPt] = useState({ x: 150, y: 478 });

  // Measure path length once after mount (DOM access required).
  useEffect(() => {
    if (pathRef.current) {
      setLen(pathRef.current.getTotalLength());
    }
  }, []);

  // Re-derive courier position whenever progress or path length changes.
  useEffect(() => {
    if (!pathRef.current || !len) return;
    const p = pathRef.current.getPointAtLength(len * progress);
    setPt({ x: p.x, y: p.y });
  }, [progress, len]);

  const travelled = len * progress;

  // Street grid: 9 horizontal + 14 vertical lines.
  const streets: React.ReactNode[] = [];
  for (let i = 1; i < 10; i++) {
    streets.push(
      <line key={`h${i}`} x1="0" y1={i * 64} x2="1000" y2={i * 64} />,
    );
  }
  for (let i = 1; i < 15; i++) {
    streets.push(
      <line key={`v${i}`} x1={i * 70} y1="0" x2={i * 70} y2="640" />,
    );
  }

  return (
    <svg
      viewBox="0 0 1000 640"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Live courier tracking map"
      style={{ display: "block" }}
    >
      <defs>
        {/* Warm glow emanating from the destination area */}
        <radialGradient id="ncMapGlow" cx="78%" cy="22%" r="65%">
          <stop offset="0%" stopColor="rgba(200,70,58,0.16)" />
          <stop offset="100%" stopColor="rgba(200,70,58,0)" />
        </radialGradient>
        {/* Dark vignette around the edges */}
        <radialGradient id="ncMapVig" cx="50%" cy="48%" r="72%">
          <stop offset="58%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
        </radialGradient>
      </defs>

      {/* Carbon base */}
      <rect x="0" y="0" width="1000" height="640" fill="var(--carbon-800)" />
      {/* Glow overlay */}
      <rect x="0" y="0" width="1000" height="640" fill="url(#ncMapGlow)" />

      {/* Street grid — faint carbon lines */}
      <g stroke="var(--carbon-600)" strokeWidth="1" opacity="0.65">
        {streets}
      </g>

      {/* Arterials — slightly heavier, more visible */}
      <g
        stroke="var(--carbon-500)"
        strokeWidth="2.5"
        opacity="0.85"
        strokeLinecap="round"
        fill="none"
      >
        <line x1="0" y1="280" x2="1000" y2="280" />
        <line x1="606" y1="0" x2="606" y2="640" />
        <path d="M 0 500 C 280 470, 520 430, 1000 470" />
        <path d="M 380 0 C 360 180, 300 300, 380 640" />
      </g>

      {/* Route — triple-pass perforation motif (carbon underlay, stamp-500 dash,
          stamp-400 travelled portion via strokeDashoffset). The ref path is
          invisible but used for getTotalLength / getPointAtLength. */}
      {/* Pass 1: carbon underlay dash */}
      <path
        ref={pathRef}
        d={WIDE_ROUTE}
        fill="none"
        stroke="var(--carbon-500)"
        strokeWidth="3.5"
        strokeDasharray="3 9"
        strokeLinecap="round"
      />
      {/* Pass 2: stamp-500 dash (the route perforation) */}
      <path
        d={WIDE_ROUTE}
        fill="none"
        stroke="var(--stamp-500)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="3 9"
        opacity="0.95"
      />
      {/* Pass 3: stamp-400 "travelled" segment — grows with progress.
          strokeDasharray:len = one dash the length of the entire path;
          strokeDashoffset:len-travelled shifts the pattern so exactly
          `travelled` pixels are visible from the origin end. */}
      <path
        d={WIDE_ROUTE}
        fill="none"
        stroke="var(--stamp-400)"
        strokeWidth="4"
        strokeLinecap="round"
        style={{
          strokeDasharray: len,
          strokeDashoffset: len - travelled,
          transition: `stroke-dashoffset var(--dur-base) linear`,
          opacity: 0.5,
        }}
      />

      {/* Origin square — the vendor / restaurant */}
      <g transform="translate(150 478)">
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
        <text
          x="0"
          y="30"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontWeight="700"
          fontSize="13"
          letterSpacing="2"
          fill="var(--text-faint)"
        >
          {vendorLabel.toUpperCase()}
        </text>
      </g>

      {/* HOME pin — destination (no pinDrift in v1) */}
      <g transform="translate(886 214)">
        <text
          x="0"
          y="-30"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontWeight="700"
          fontSize="14"
          letterSpacing="3"
          fill="var(--text-strong)"
        >
          HOME
        </text>
        {/* Teardrop pin body */}
        <path
          d="M0 8 C -12 -6 -12 -22 0 -22 C 12 -22 12 -6 0 8 Z"
          fill="var(--carbon-900)"
          stroke="var(--stamp-500)"
          strokeWidth="3"
          transform="translate(0 6)"
        />
        {/* Pin dot */}
        <circle cy="-11" r="4.5" fill="var(--stamp-500)" />
      </g>

      {/* Courier dot — follows progress along the route.
          Transition smooths between rAF frames (300ms linear). */}
      <g
        transform={`translate(${pt.x} ${pt.y})`}
        style={{ transition: `transform var(--dur-base) linear` }}
      >
        {/* Pulse ring — hidden when reduce (SMIL doesn't respect prefers-reduced-motion CSS) */}
        {!reduce && (
          <circle r="22" fill="rgba(200,70,58,0.16)">
            <animate
              attributeName="r"
              values="18;32;18"
              dur="2.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.35;0;0.35"
              dur="2.6s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        {/* Courier dot */}
        <circle
          r="14"
          fill="var(--stamp-600)"
          stroke="var(--paper-000)"
          strokeWidth="2.5"
        />
        {/* Send-arrow glyph (courier icon) */}
        <g
          transform="translate(-8 -8) scale(0.66)"
          fill="var(--paper-000)"
        >
          <path d="m3 11 19-9-9 19-2-8-8-2z" />
        </g>
      </g>

      {/* Vignette overlay — darkens edges, depth without color */}
      <rect
        x="0"
        y="0"
        width="1000"
        height="640"
        fill="url(#ncMapVig)"
        pointerEvents="none"
      />
    </svg>
  );
}
