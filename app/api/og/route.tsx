/**
 * GET /api/og — OG share-card image (1200×630 PNG).
 *
 * Two variants, driven entirely by query params — no DB read:
 *   order  ?v=order&c=NC-XXXXXXXX&t=<epoch-ms>
 *   me     ?v=me&s=<savedCents>&o=<orders>&w=<waitDays>&p=<seed>
 *
 * Malformed params → 400 text. Valid params → long-lived PNG (1-year cache).
 * Cards are effectively static per URL (the "days" counter drifts by day —
 * that's fine; the far-future max-age keeps CDN churn low).
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parseShareParams, daysInTransit } from "@/lib/viral/share";
import { pseudonymFromSeed } from "@/lib/viral/pseudonym";
import { formatCents } from "@/lib/utils/money";

// Must be nodejs — we use fs.readFile to load font files.
export const runtime = "nodejs";

// ── Design tokens (paper / light-theme hex literals) ────────────────────────
// ImageResponse/satori cannot resolve CSS custom properties, so we use the
// literal hex values that mirror the :root block in app/tokens.css.
const T = {
  paper000: "#fbf7ee", // --paper-000
  ink900:   "#1a1612", // --ink-900
  ink600:   "#564d41", // --ink-600
  ink500:   "#6f6557", // --ink-500
  ink400:   "#938876", // --ink-400
  stamp600: "#b4392c", // --stamp-600
} as const;

// ── Font cache ───────────────────────────────────────────────────────────────
// Module-level promise: fonts are read once per cold start, then reused.
// Static 700/800 PlusJakartaSans instances are used instead of the variable
// font — satori does not apply axis values, so the variable TTF renders at
// its default weight. See assets/og-fonts/README.md.

type FontData = {
  display700: Buffer;
  display800: Buffer;
  mono400:    Buffer;
  mono700:    Buffer;
};

let fontsCache: Promise<FontData> | null = null;

function getFonts(): Promise<FontData> {
  if (!fontsCache) {
    const dir = path.join(process.cwd(), "assets/og-fonts");
    fontsCache = Promise.all([
      fs.readFile(path.join(dir, "PlusJakartaSans-Bold.ttf")),
      fs.readFile(path.join(dir, "PlusJakartaSans-ExtraBold.ttf")),
      fs.readFile(path.join(dir, "SpaceMono-Regular.ttf")),
      fs.readFile(path.join(dir, "SpaceMono-Bold.ttf")),
    ])
      .then(([display700, display800, mono400, mono700]) => ({
        display700,
        display800,
        mono400,
        mono700,
      }))
      .catch((err) => {
        // Don't cache a rejection: a transient fs failure would otherwise
        // break every OG card until the next cold start.
        fontsCache = null;
        throw err;
      });
  }
  return fontsCache;
}

// ── Card dimensions ──────────────────────────────────────────────────────────
const W = 1200;
const H = 630;

// ── Shared layout primitives ─────────────────────────────────────────────────
// These are inlined per-card rather than shared variables so TypeScript stays
// happy and each card is self-contained — satori sees a plain object tree.

/** Dashed route line near the bottom of the card. */
function DashedLine() {
  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        right: 56,
        bottom: 150,
        height: 0,
        borderTop: `3px dashed ${T.stamp600}`,
        display: "flex",
      }}
    />
  );
}

/** Origin dot on the left of the route line. */
function OriginDot() {
  return (
    <div
      style={{
        position: "absolute",
        left: 52,
        bottom: 144,
        width: 12,
        height: 12,
        borderRadius: 999,
        background: T.ink900,
        display: "flex",
      }}
    />
  );
}

/** "..." end marker on the right — signals perpetual recalculation. */
function EllipsisMarker() {
  return (
    <div
      style={{
        position: "absolute",
        right: 40,
        bottom: 170,
        fontFamily: "'Space Mono'",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "0.06em",
        color: T.ink400,
        display: "flex",
      }}
    >
      ...
    </div>
  );
}

/** Rotated stamp badge — the punchline. Opacity approximates the design's
 *  mix-blend-mode:multiply without satori blend support. */
function NeverArrivedStamp({ top }: { top: number }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 60,
        top,
        transform: "rotate(-8deg)",
        display: "flex",
        alignItems: "center",
        fontFamily: "'Space Mono'",
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: T.stamp600,
        padding: "10px 18px",
        border: `3px solid ${T.stamp600}`,
        borderRadius: 4,
        opacity: 0.92,
      }}
    >
      Never arrived
    </div>
  );
}

/** Site wordmark — bottom-left anchor. */
function Wordmark() {
  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        bottom: 24,
        fontFamily: "'Space Mono'",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.08em",
        color: T.ink900,
        display: "flex",
      }}
    >
      NEVERCOMES
    </div>
  );
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Convert URL search params to a plain string-keyed record for parseShareParams.
  const raw: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const payload = parseShareParams(raw);
  if (!payload) {
    return new Response("Bad Request: malformed or missing share params", {
      status: 400,
    });
  }

  const fonts = await getFonts();

  const fontList = [
    {
      name: "Plus Jakarta Sans",
      data: fonts.display700,
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "Plus Jakarta Sans",
      data: fonts.display800,
      weight: 800 as const,
      style: "normal" as const,
    },
    {
      name: "Space Mono",
      data: fonts.mono400,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Space Mono",
      data: fonts.mono700,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];

  // ── Variant: order (2a) ────────────────────────────────────────────────────
  if (payload.v === "order") {
    const days = daysInTransit(payload.createdAtMs, Date.now());

    // Day grammar: 0 → "since today"; 1 → "for 1 day"; N → "for N days".
    // The first display line is split across two visual lines (matching the
    // design at 76px — the second part starts with "for" or "since").
    const transitLine1 = days === 0 ? "In transit since" : "In transit for";
    const transitLine2 =
      days === 0 ? "today." : days === 1 ? "1 day." : `${days} days.`;

    return new ImageResponse(
      (
        <div
          style={{
            width: W,
            height: H,
            position: "relative",
            background: T.paper000,
            overflow: "hidden",
            display: "flex",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              position: "absolute",
              top: 36,
              left: 56,
              fontFamily: "'Space Mono'",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.14em",
              color: T.ink500,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            ORDER #{payload.code} · LIVE TRACKING
          </div>

          {/* Display lines — ink-900 header + stamp-600 punchline */}
          <div
            style={{
              position: "absolute",
              top: 120,
              left: 56,
              right: 56,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Line 1a: "In transit for" or "In transit since" */}
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans'",
                fontWeight: 800,
                fontSize: 76,
                letterSpacing: "-0.02em",
                lineHeight: 1.02,
                color: T.ink900,
                display: "flex",
              }}
            >
              {transitLine1}
            </div>
            {/* Line 1b: "N days." / "1 day." / "today." */}
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans'",
                fontWeight: 800,
                fontSize: 76,
                letterSpacing: "-0.02em",
                lineHeight: 1.02,
                color: T.ink900,
                display: "flex",
              }}
            >
              {transitLine2}
            </div>
            {/* Line 2: the punchline */}
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans'",
                fontWeight: 800,
                fontSize: 76,
                letterSpacing: "-0.02em",
                lineHeight: 1.02,
                color: T.stamp600,
                marginTop: 6,
                display: "flex",
              }}
            >
              It never comes.
            </div>
          </div>

          <DashedLine />
          <OriginDot />
          <EllipsisMarker />

          {/* Footer row */}
          <div
            style={{
              position: "absolute",
              left: 56,
              bottom: 70,
              display: "flex",
              gap: 40,
              fontFamily: "'Space Mono'",
              fontSize: 15,
              letterSpacing: "0.04em",
              color: T.ink600,
            }}
          >
            <div style={{ display: "flex" }}>
              EST. ARRIVAL — RECALCULATING...
            </div>
            <div style={{ display: "flex" }}>$0.00 CAD</div>
          </div>

          <NeverArrivedStamp top={280} />
          <Wordmark />
        </div>
      ),
      {
        width: W,
        height: H,
        fonts: fontList,
        headers: {
          "Cache-Control":
            "public, immutable, no-transform, max-age=31536000",
        },
      },
    );
  }

  // ── Variant: me (2b) ───────────────────────────────────────────────────────
  const pseudo = pseudonymFromSeed(payload.seed);
  // formatCents uses Intl.NumberFormat("en-CA") → "$X,XXX.XX" form in Node.js.
  const savedFormatted = formatCents(payload.savedCents);

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          position: "relative",
          background: T.paper000,
          overflow: "hidden",
          display: "flex",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 56,
            fontFamily: "'Space Mono'",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.14em",
            color: T.ink500,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          {pseudo.full} · NEVERCOMES
        </div>

        {/* Display lines — slightly larger (84px per design 2b) */}
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 56,
            right: 56,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans'",
              fontWeight: 800,
              fontSize: 84,
              letterSpacing: "-0.02em",
              lineHeight: 1.0,
              color: T.ink900,
              display: "flex",
            }}
          >
            {savedFormatted} saved.
          </div>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans'",
              fontWeight: 800,
              fontSize: 84,
              letterSpacing: "-0.02em",
              lineHeight: 1.0,
              color: T.stamp600,
              marginTop: 8,
              display: "flex",
            }}
          >
            0 things received.
          </div>
        </div>

        <DashedLine />
        <OriginDot />
        <EllipsisMarker />

        {/* Footer row */}
        <div
          style={{
            position: "absolute",
            left: 56,
            bottom: 70,
            display: "flex",
            gap: 40,
            fontFamily: "'Space Mono'",
            fontSize: 15,
            letterSpacing: "0.04em",
            color: T.ink600,
          }}
        >
          <div style={{ display: "flex" }}>
            {payload.orders} ORDERS PLACED
          </div>
          <div style={{ display: "flex" }}>
            {payload.waitDays} DAY LONGEST WAIT
          </div>
        </div>

        <NeverArrivedStamp top={290} />
        <Wordmark />
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: fontList,
      headers: {
        "Cache-Control":
          "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
