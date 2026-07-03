/**
 * LandingHeader — sticky translucent navigation for the landing page.
 *
 * Composition:
 *   - Logo: "NeverComes" (display font, 800 weight) + "EST. NEVER" eyebrow
 *   - Nav: anchor links (#how, #idea, #proof) + primary CTA → /browse
 *
 * Server component — no client-side state. Anchor links use native browser
 * smooth-scroll (enabled via `scroll-behavior: smooth` on html in globals.css).
 *
 * The translucent background matches the spec:
 *   rgba(16,13,10,0.86) = roughly carbon-900 at 86% opacity.
 *   backdrop-filter: blur(8px) — progressive enhancement (no-JS safe).
 */

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function LandingHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(16,13,10,0.86)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "16px clamp(20px,5vw,56px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        {/* Logo */}
        <a
          href="#top"
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            textDecoration: "none",
          }}
          aria-label="NeverComes — back to top"
        >
          <span
            className="font-display font-extrabold text-fg-strong"
            style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
          >
            NeverComes
          </span>
          <span
            className="font-mono text-2xs font-bold uppercase tracking-label text-fg-faint"
          >
            EST. NEVER
          </span>
        </a>

        {/* Nav */}
        <nav
          aria-label="Landing page sections"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(16px,2.4vw,34px)",
          }}
        >
          <a
            href="#how"
            className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted hover:text-fg-strong transition-colors"
            style={{ textDecoration: "none" }}
          >
            How it (doesn&rsquo;t) work
          </a>
          <a
            href="#idea"
            className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted hover:text-fg-strong transition-colors"
            style={{ textDecoration: "none" }}
          >
            The idea
          </a>
          <a
            href="#proof"
            className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted hover:text-fg-strong transition-colors"
            style={{ textDecoration: "none" }}
          >
            Reviews
          </a>

          {/* Primary CTA */}
          <Link href="/browse">
            <Button variant="primary" size="sm">
              Start a fake order
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
