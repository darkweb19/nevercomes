import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * ClosingCta — closing call-to-action band.
 *
 * Centered section with:
 *   - Radial red glow background
 *   - Eyebrow "EST. ARRIVAL · NEVER"
 *   - H2 heading "Want something you'll never get?"
 *   - Primary CTA button to /browse and ghost button to /me
 *   - Mono tagline
 */
export function ClosingCta() {
  return (
    <section className="relative border-t border-hairline overflow-hidden">
      {/* Radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 140% at 80% 10%, rgba(200, 70, 58, 0.14), rgba(16, 13, 10, 0) 60%)",
        }}
      />

      {/* Content */}
      <div
        className="relative mx-auto max-w-[1180px] text-center flex flex-col items-center"
        style={{
          padding: "clamp(64px, 9vw, 128px) clamp(20px, 5vw, 56px)",
        }}
      >
        {/* Eyebrow */}
        <Eyebrow className="text-accent">EST. ARRIVAL · NEVER</Eyebrow>

        {/* Heading */}
        <h2
          className="font-display font-bold leading-tight tracking-tight text-fg-strong mt-4"
          style={{
            fontSize: "clamp(34px, 5.4vw, 68px)",
            maxWidth: "18ch",
          }}
        >
          Want something you&rsquo;ll never get?
        </h2>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-9">
          <Link href="/browse">
            <Button variant="primary" size="lg">
              Start a fake order
            </Button>
          </Link>
          <Link href="/me">
            <Button variant="ghost" size="lg">
              Track an order
            </Button>
          </Link>
        </div>

        {/* Tagline */}
        <div className="font-mono text-2xs font-bold uppercase tracking-label text-fg-faint mt-7">
          ALL THE DOPAMINE OF BUYING. NONE OF THE RECEIPT.
        </div>
      </div>
    </section>
  );
}
