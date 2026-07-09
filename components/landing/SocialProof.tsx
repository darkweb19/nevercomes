import { Card } from "@/components/ui/Card";
import { LiveCounters } from "@/components/viral/LiveCounters";

/**
 * SocialProof — social proof section with the live-counter stats strip and
 * testimonial cards.
 *
 * Stats strip: delegated entirely to <LiveCounters />, which owns the three
 * cells (shopping now / orders never arriving / delivered ever = 0).
 *
 * Three testimonial cards (raised):
 *   - Star rating (⋆⋆⋆⋆⋆) in accent color
 *   - Display-font quote
 *   - Name in display font
 *   - Mono metadata line
 */
export function SocialProof() {
  const testimonials = [
    {
      quote: "Best app I've never received anything from. The wait is immaculate.",
      author: "M. Tran",
      meta: "#NC-2210 · IN TRANSIT 88 DAYS",
    },
    {
      quote: "My courier has been two streets away since March. We're basically close now.",
      author: "J. Okafor",
      meta: "#NC-0907 · ARRIVING ANY MOMENT",
    },
    {
      quote: "I declared it lost. Then I tracked it again anyway. Couldn't help myself.",
      author: "R. Della",
      meta: "#NC-4471 · DECLARED LOST · RETRACKING",
    },
  ];

  return (
    <section className="border-t border-hairline bg-sunken">
      <div
        className="mx-auto max-w-[1180px]"
        style={{
          padding: "clamp(48px, 6vw, 88px) clamp(20px, 5vw, 56px)",
        }}
      >
        {/* Live-counter stats strip */}
        <div className="mb-[clamp(36px,4vw,56px)]">
          <LiveCounters />
        </div>

        {/* Testimonials */}
        <div className="flex flex-wrap" style={{ gap: "clamp(16px, 2vw, 24px)" }}>
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="flex-1 basis-80 min-w-64"
            >
              <Card raised className="flex h-full flex-col gap-4">
                {/* Stars */}
                <div className="font-mono text-sm font-bold uppercase tracking-widest text-accent">
                  ⋆⋆⋆⋆⋆
                </div>

                {/* Quote */}
                <p className="font-display text-lg font-medium leading-snug text-fg flex-1 m-0">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author and meta */}
                <div>
                  <div className="font-display text-sm font-bold text-fg-strong">
                    {t.author}
                  </div>
                  <div className="font-mono text-2xs uppercase tracking-label text-fg-faint mt-0.5">
                    {t.meta}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
