/**
 * Hero — the split hero section on the NeverComes landing page.
 *
 * Left: eyebrow + H1 + body copy + CTA buttons + $0.00 disclaimer strip.
 * Right: <TrackerTeaser> (the fake order card with animated SVG courier map).
 *
 * Server component — no state or effects needed here.
 * The interactive parts (EtaTicker, SMIL motion) live inside TrackerTeaser/EtaTicker.
 *
 * Anchors:
 *   - "Start a fake order" → /browse
 *   - "How it (doesn't) work" → #how  (smooth-scroll, works without JS via CSS)
 */

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TrackerTeaser } from "./TrackerTeaser";

export function Hero() {
  return (
    <section
      style={{
        maxWidth: "1180px",
        margin: "0 auto",
        padding:
          "clamp(48px,7vw,104px) clamp(20px,5vw,56px) clamp(40px,6vw,80px)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "clamp(40px,5vw,72px)",
      }}
    >
      {/* ── Left column — copy ──────────────────────────────────────────── */}
      <div style={{ flex: "1 1 440px", minWidth: "300px" }}>
        {/* Eyebrow with hairline rule */}
        <span
          className="font-mono text-2xs font-bold uppercase tracking-label"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--text-accent)",
          }}
        >
          <span
            style={{
              width: "24px",
              height: "0",
              borderTop: "1px solid var(--text-accent)",
            }}
            aria-hidden="true"
          />
          ALL THE DOPAMINE OF BUYING
        </span>

        {/* H1 */}
        <h1
          className="font-display font-extrabold text-fg-strong"
          style={{
            fontSize: "clamp(42px,6.4vw,76px)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            margin: "18px 0 0",
            textWrap: "balance",
          }}
        >
          Order anything.
          <br />
          It never comes.
        </h1>

        {/* Body copy */}
        <p
          className="text-fg-muted"
          style={{
            fontSize: "clamp(16px,1.4vw,19px)",
            lineHeight: 1.5,
            margin: "22px 0 0",
            maxWidth: "46ch",
          }}
        >
          Free checkout. A courier forever two streets away. The dot moves —
          the bag does not.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "14px",
            marginTop: "34px",
          }}
        >
          <Link href="/browse">
            <Button variant="primary" size="lg">
              Start a fake order
            </Button>
          </Link>
          <a href="#how">
            <Button variant="secondary" size="lg">
              How it (doesn&rsquo;t) work
            </Button>
          </a>
        </div>

        {/* $0.00 disclaimer strip */}
        <div
          className="font-mono text-2xs font-bold uppercase tracking-label text-fg-faint"
          style={{
            marginTop: "26px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <span>$0.00 CHARGED · EVER</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>NO CARD REQUIRED</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>NO RECEIPT</span>
        </div>
      </div>

      {/* ── Right column — tracker teaser ─────────────────────────────── */}
      <div
        style={{
          flex: "1 1 420px",
          minWidth: "300px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "430px" }}>
          <TrackerTeaser />
        </div>
      </div>
    </section>
  );
}
