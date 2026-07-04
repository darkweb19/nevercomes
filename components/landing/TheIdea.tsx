import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * "THE (REAL) IDEA" section — two-column flex-wrap layout: a dashed pull-quote
 * on the left, a deadpan &ldquo;anticipation curve&rdquo; SVG chart on the right.
 * Columns stack on narrow viewports. The #idea anchor lives on the parent page.
 */
export function TheIdea() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-[1180px] flex flex-wrap items-center gap-x-[clamp(40px,6vw,80px)] gap-y-12 px-[clamp(20px,5vw,56px)] py-[clamp(56px,8vw,112px)]">

        {/* Left: pull-quote */}
        <div
          className="flex-1 min-w-[260px] max-w-[520px] pl-[clamp(24px,4vw,44px)]"
          style={{ borderLeft: "2px dashed var(--border-perf)" }}
        >
          <Eyebrow className="text-fg-faint">THE (REAL) IDEA</Eyebrow>

          <p
            className="mt-5 font-display font-medium leading-[1.35] tracking-[-0.01em] text-fg"
            style={{ fontSize: "clamp(22px,2.6vw,32px)" }}
          >
            Dopamine fires while you&rsquo;re waiting, not when the package
            lands. The anticipation is the high.
          </p>

          <p
            className="mt-5 leading-[1.55] text-fg-muted"
            style={{ fontSize: "clamp(15px,1.3vw,17px)" }}
          >
            So we deleted the arrival. Nothing ships. Nothing is charged.
          </p>

          <div className="mt-[26px] font-mono text-2xs font-bold uppercase tracking-label text-fg-faint">
            &mdash; THE SYSTEM VOICE
          </div>
        </div>

        {/* Right: anticipation curve chart */}
        <div className="flex-1 min-w-[260px] max-w-[460px]">
          {/* viewBox: 400×230; chart area x 44–385, y 20–195; asymptote at y=30 */}
          <svg
            viewBox="0 0 400 230"
            width="100%"
            aria-hidden="true"
            focusable="false"
          >
            {/* Faint horizontal gridlines */}
            <line x1="44" y1="80"  x2="385" y2="80"  stroke="var(--border-hairline)" strokeWidth="1" />
            <line x1="44" y1="130" x2="385" y2="130" stroke="var(--border-hairline)" strokeWidth="1" />

            {/* Dashed asymptote — ARRIVAL, never reached */}
            <line
              x1="44" y1="30" x2="385" y2="30"
              stroke="var(--text-faint)"
              strokeWidth="1"
              strokeDasharray="5 4"
            />
            <text
              x="382" y="25"
              fontFamily="var(--font-mono)"
              fontSize="8"
              fill="var(--text-faint)"
              letterSpacing="1.5"
              textAnchor="end"
            >
              ARRIVAL
            </text>

            {/* Axes */}
            <line x1="44" y1="20"  x2="44"  y2="195" stroke="var(--border-hairline)" strokeWidth="1" />
            <line x1="44" y1="195" x2="385" y2="195" stroke="var(--border-hairline)" strokeWidth="1" />

            {/* Y-axis label */}
            <text
              transform="translate(10,107) rotate(-90)"
              fontFamily="var(--font-mono)"
              fontSize="8"
              fill="var(--text-muted)"
              letterSpacing="1"
              textAnchor="middle"
            >
              DOPAMINE &uarr;
            </text>

            {/* The dopamine curve — steep rise, then oscillates toward (never reaching) ARRIVAL */}
            <path
              d="M 44,195 C 65,195 90,52 125,50 S 158,74 185,61 S 222,40 248,49 S 278,66 305,55 S 338,43 362,49 L 385,48"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X-axis label */}
            <text
              x="214" y="215"
              fontFamily="var(--font-mono)"
              fontSize="8"
              fill="var(--text-muted)"
              letterSpacing="1"
              textAnchor="middle"
            >
              TIME SINCE ORDER &rarr;
            </text>
          </svg>

          {/* Chart caption */}
          <p className="mt-2 font-mono text-2xs uppercase tracking-label text-fg-faint text-center">
            DOPAMINE vs. TIME SINCE ORDER &middot; N&nbsp;=&nbsp;NEVER
          </p>
        </div>

      </div>
    </section>
  );
}
