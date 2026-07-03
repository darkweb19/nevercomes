import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Perforation } from "@/components/ui/Perforation";

/**
 * LandingFooter — footer for the landing page.
 *
 * Sections:
 *   - Brand block with NeverComes logo and tagline
 *   - ABOUT column with section links (#idea, #how, #proof)
 *   - PRIVACY column with static mono blurb lines
 *   - Perforation divider
 *   - Bottom meta row
 */
export function LandingFooter() {
  return (
    <footer className="border-t border-hairline bg-sunken">
      <div
        className="mx-auto max-w-[1180px]"
        style={{
          padding: "clamp(40px, 5vw, 64px) clamp(20px, 5vw, 56px)",
        }}
      >
        {/* Top section: brand + nav */}
        <div className="flex flex-wrap gap-8 justify-between items-start">
          {/* Brand block */}
          <div className="max-w-80">
            <div className="flex items-baseline gap-2.5">
              <span className="font-display font-bold tracking-tight text-fg-strong" style={{ fontSize: "20px" }}>
                NeverComes
              </span>
              <Eyebrow className="text-fg-faint">EST. NEVER</Eyebrow>
            </div>
            <p className="text-sm leading-relaxed text-fg-muted mt-3.5">
              A shopping app where the dot moves and the bag does not. No
              couriers were dispatched in the making of this.
            </p>
          </div>

          {/* Nav columns */}
          <div
            className="flex flex-wrap"
            style={{
              gap: "clamp(40px, 6vw, 80px)",
            }}
          >
            {/* ABOUT column */}
            <div className="flex flex-col gap-3">
              <Eyebrow className="text-fg-faint">ABOUT</Eyebrow>
              <Link
                href="#idea"
                className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted no-underline hover:text-fg-strong transition-colors"
              >
                The (real) idea
              </Link>
              <Link
                href="#how"
                className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted no-underline hover:text-fg-strong transition-colors"
              >
                How it (doesn&rsquo;t) work
              </Link>
              <Link
                href="#proof"
                className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted no-underline hover:text-fg-strong transition-colors"
              >
                Reviews
              </Link>
            </div>

            {/* PRIVACY column */}
            <div className="flex flex-col gap-3">
              <Eyebrow className="text-fg-faint">PRIVACY</Eyebrow>
              <span className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
                We keep your data fake.
              </span>
              <span className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
                And minimal.
              </span>
              <span className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
                Mostly there is none.
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            margin: "clamp(32px, 4vw, 48px) 0 20px",
          }}
        >
          <Perforation />
        </div>

        {/* Bottom row */}
        <div className="flex flex-wrap gap-3.5 justify-between items-center">
          <span className="font-mono text-2xs font-bold uppercase tracking-label text-fg-faint">
            NO REFUND. NOTHING WAS CHARGED.
          </span>
          <span className="font-mono text-2xs font-bold uppercase tracking-label text-fg-faint">
            © NEVERCOMES — EST. NEVER
          </span>
        </div>
      </div>
    </footer>
  );
}
