/**
 * /w — public share-landing page (Phase 10, Screen 2).
 *
 * Pure server component — no DB read, no client JS. All data travels in the
 * query string via parseShareParams (same contract as /api/og). Renders the
 * fixed "paper" share card as HTML/CSS mirroring the OG image design exactly,
 * followed by a single CTA. Invalid params → 404.
 *
 * Two variants:
 *   order  ?v=order&c=NC-XXXXXXXX&t=<epoch-ms>
 *   me     ?v=me&s=<savedCents>&o=<orders>&w=<waitDays>&p=<seed>
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseShareParams, daysInTransit, buildSharePath } from "@/lib/viral/share";
import { pseudonymFromSeed } from "@/lib/viral/pseudonym";
import { formatCents } from "@/lib/utils/money";

// ── Design tokens (literal hex — card is fixed paper, not themed) ────────────
// Mirror the T object in app/api/og/route.tsx exactly.
const T = {
  paper000: "#fbf7ee",
  ink900:   "#1a1612",
  ink600:   "#564d41",
  ink500:   "#6f6557",
  ink400:   "#938876",
  stamp600: "#b4392c",
} as const;

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const payload = parseShareParams(await searchParams);
  if (!payload) return {};

  let title: string;
  if (payload.v === "order") {
    const days = daysInTransit(payload.createdAtMs, Date.now());
    const dayStr = days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`;
    const transitPhrase = days === 0 ? "In transit since today." : `In transit for ${dayStr}.`;
    title = `${transitPhrase} It never comes.`;
  } else {
    title = `${formatCents(payload.savedCents)} saved. 0 things received.`;
  }

  const description = "NeverComes — all the dopamine of buying, none of the receipt.";

  // Build the OG image URL from the same payload — reuse buildSharePath's
  // param encoding and swap /w? for /api/og?.
  const ogImagePath = buildSharePath(payload).replace(/^\/w\?/, "/api/og?");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImagePath, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImagePath],
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function WPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const payload = parseShareParams(await searchParams);
  if (!payload) notFound();

  // ── Compute variant-specific copy ──────────────────────────────────────────
  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
  const now = Date.now();

  let eyebrow: string;
  let displayLine1: string;
  let displayLine2: string;
  let punchline: string;
  let footerLeft: string;
  let footerRight: string;

  if (payload.v === "order") {
    const days = daysInTransit(payload.createdAtMs, now);
    eyebrow = `ORDER #${payload.code} · LIVE TRACKING`;
    displayLine1 = days === 0 ? "In transit since" : "In transit for";
    displayLine2 = days === 0 ? "today." : days === 1 ? "1 day." : `${days} days.`;
    punchline = "It never comes.";
    footerLeft = "EST. ARRIVAL — RECALCULATING...";
    footerRight = "$0.00 CAD";
  } else {
    const pseudo = pseudonymFromSeed(payload.seed);
    eyebrow = `${pseudo.full} · NEVERCOMES`;
    displayLine1 = `${formatCents(payload.savedCents)} saved.`;
    displayLine2 = "0 things received.";
    punchline = ""; // variant 2b has no third punchline line
    footerLeft = `${payload.orders} ORDERS PLACED`;
    footerRight = `${payload.waitDays} DAY LONGEST WAIT`;
  }

  const isOrder = payload.v === "order";

  return (
    /* Page shell — uses site bg-page token (themed dark/light by body) */
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-page">

      {/*
       * Card wrapper — preserves 1200:630 aspect ratio up to 880px.
       * Uses a padding-top trick (52.5% = 630/1200) so the inner absolutely-
       * positioned card always fills the slot. Below ~880px it scales down
       * naturally as the wrapper width tracks the viewport.
       */}
      {/* containerType makes cqw units below resolve against the card width,
          so type scales with the card (not the viewport) at every size. */}
      <div
        className="w-full"
        style={{ maxWidth: "880px", containerType: "inline-size" }}
      >
        <div
          style={{
            position: "relative",
            paddingTop: "52.5%", /* 630/1200 */
            width: "100%",
          }}
        >
          {/* ── The paper card (fixed light palette, never themed) ────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: T.paper000,
              overflow: "hidden",
              borderRadius: "4px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
            }}
          >
            {/* Eyebrow */}
            <div
              style={{
                position: "absolute",
                top: "5.7%",    /* ~36/630 */
                left: "4.7%",   /* ~56/1200 */
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "clamp(8px, 1.083cqw, 13px)",
                letterSpacing: "0.14em",
                color: T.ink500,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              {eyebrow}
            </div>

            {/* Display lines */}
            <div
              style={{
                position: "absolute",
                top: isOrder ? "19%" : "20.6%", /* order: 120/630 ≈ 19%, me: 130/630 ≈ 20.6% */
                left: "4.7%",
                right: "4.7%",
              }}
            >
              {/* Line 1: transit phrase (order) or saved amount (me) */}
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: isOrder
                    ? "clamp(20px, 6.333cqw, 76px)"
                    : "clamp(20px, 7cqw, 84px)",
                  letterSpacing: "-0.02em",
                  lineHeight: isOrder ? 1.02 : 1.0,
                  color: T.ink900,
                }}
              >
                {displayLine1}
              </div>

              {/* Line 2: day count (order) or "0 things received" (me, stamp red) */}
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: isOrder
                    ? "clamp(20px, 6.333cqw, 76px)"
                    : "clamp(20px, 7cqw, 84px)",
                  letterSpacing: "-0.02em",
                  lineHeight: isOrder ? 1.02 : 1.0,
                  color: isOrder ? T.ink900 : T.stamp600,
                  marginTop: isOrder ? "0" : "clamp(2px, 0.667cqw, 8px)",
                }}
              >
                {displayLine2}
              </div>

              {/* Line 3: punchline in stamp red (order variant only) */}
              {isOrder && (
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: "clamp(20px, 6.333cqw, 76px)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.02,
                    color: T.stamp600,
                    marginTop: "clamp(1px, 0.5cqw, 6px)",
                  }}
                >
                  {punchline}
                </div>
              )}
            </div>

            {/* Dashed route line — bottom: 150/630 ≈ 23.8% */}
            <div
              style={{
                position: "absolute",
                left: "4.7%",
                right: "4.7%",
                bottom: "23.8%",
                height: 0,
                borderTop: `clamp(1px, 0.25cqw, 3px) dashed ${T.stamp600}`,
              }}
            />

            {/* Origin dot */}
            <div
              style={{
                position: "absolute",
                left: "4.3%",       /* ~52/1200 */
                bottom: "22.9%",    /* ~144/630 */
                width: "clamp(5px, 1cqw, 12px)",
                height: "clamp(5px, 1cqw, 12px)",
                borderRadius: "999px",
                background: T.ink900,
              }}
            />

            {/* "..." end marker */}
            <div
              style={{
                position: "absolute",
                right: "3.3%",     /* ~40/1200 */
                bottom: "27%",     /* ~170/630 */
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "clamp(6px, 1.167cqw, 14px)",
                letterSpacing: "0.06em",
                color: T.ink400,
                lineHeight: 1,
              }}
            >
              ...
            </div>

            {/* Footer row */}
            <div
              style={{
                position: "absolute",
                left: "4.7%",
                bottom: "11.1%",  /* ~70/630 */
                display: "flex",
                gap: "clamp(8px, 3.333cqw, 40px)",
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(6px, 1.25cqw, 15px)",
                letterSpacing: "0.04em",
                color: T.ink600,
                whiteSpace: "nowrap",
              }}
            >
              <span>{footerLeft}</span>
              <span>{footerRight}</span>
            </div>

            {/* Rotated "NEVER ARRIVED" stamp badge */}
            <div
              style={{
                position: "absolute",
                right: "5%",      /* ~60/1200 */
                top: isOrder ? "44.4%" : "46%", /* order: 280/630, me: 290/630 */
                transform: "rotate(-8deg)",
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "clamp(7px, 1.833cqw, 22px)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: T.stamp600,
                padding: "clamp(3px, 0.833cqw, 10px) clamp(5px, 1.5cqw, 18px)",
                border: `clamp(1px, 0.25cqw, 3px) solid ${T.stamp600}`,
                borderRadius: "4px",
                opacity: 0.92,
                whiteSpace: "nowrap",
              }}
            >
              Never arrived
            </div>

            {/* NEVERCOMES wordmark — bottom-left */}
            <div
              style={{
                position: "absolute",
                left: "4.7%",
                bottom: "3.8%",   /* ~24/630 */
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "clamp(6px, 1.083cqw, 13px)",
                letterSpacing: "0.08em",
                color: T.ink900,
                lineHeight: 1,
              }}
            >
              NEVERCOMES
            </div>
          </div>{/* /card */}
        </div>{/* /aspect-ratio wrapper */}
      </div>{/* /max-width wrapper */}

      {/* CTA — one link, nothing else */}
      <div className="mt-8">
        <Link
          href="/browse"
          className={[
            "inline-flex items-center justify-center gap-2 rounded-md",
            "font-mono uppercase tracking-wide transition-colors",
            "h-10 px-4 text-base",
            "bg-card text-fg-strong border border-hairline hover:bg-sunken",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          ].join(" ")}
        >
          Start your own wait
        </Link>
      </div>
    </div>
  );
}
