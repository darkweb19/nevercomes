import { Eyebrow } from "@/components/ui/Eyebrow";
import { Stamp } from "@/components/ui/Stamp";
import { Perforation } from "@/components/ui/Perforation";

// ── Step data ──────────────────────────────────────────────────────────────
// Steps 01–04 are "real"; step 05 is the punchline. The connector between
// step 04 and step 05 uses the accent route variant to signal the break.

const STEPS = [
  {
    num: "01",
    label: "Browse",
    copy: "Scroll a catalogue of things you will never hold.",
    icon: (
      /* Magnifier / search */
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-strong)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
    punchline: false,
  },
  {
    num: "02",
    label: "Add to cart",
    copy: "Tap. A little dopamine. Tap again. Repeat as needed.",
    icon: (
      /* Shopping cart */
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-strong)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    ),
    punchline: false,
  },
  {
    num: "03",
    label: "Checkout",
    copy: "$0.00 CAD. No card. No receipt. Total clears instantly.",
    icon: (
      /* Receipt / invoice */
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-strong)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M8 9h8M8 13h6" />
      </svg>
    ),
    punchline: false,
  },
  {
    num: "04",
    label: "Track",
    copy: "Watch the courier crawl closer. And closer. And closer.",
    icon: (
      /* Navigation / courier dot */
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-strong)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m3 11 19-9-9 19-2-8-8-2z" />
      </svg>
    ),
    punchline: false,
  },
  {
    num: "05",
    label: "It never arrives",
    copy: "The dot holds two streets away. The bag does not come. As designed.",
    icon: (
      /* Circle with diagonal slash — accent-colored for the punchline */
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m4.9 4.9 14.2 14.2" />
      </svg>
    ),
    punchline: true,
  },
] as const;

// ── Component ──────────────────────────────────────────────────────────────

/**
 * "How it (doesn't) work" section — five steps laid out as a horizontal flex
 * row with Perforation connectors between them. The anchor `#how` is applied
 * by the parent page, not here. Section background is `surface-sunken`.
 */
export function HowItWorks() {
  return (
    <section className="border-t border-hairline bg-sunken">
      <div className="mx-auto max-w-[1180px] px-[clamp(20px,5vw,56px)] py-[clamp(56px,7vw,104px)]">

        {/* ── Section header ─────────────────────────────────────────────── */}
        <div className="mb-[clamp(36px,5vw,64px)] flex flex-wrap items-end justify-between gap-[18px]">
          <div>
            {/* Eyebrow with a small leading hairline rule */}
            <Eyebrow className="inline-flex items-center gap-[10px] text-fg-muted">
              <span
                className="h-0 w-6 border-t border-[var(--text-faint)]"
                aria-hidden="true"
              />
              THE FLOW
            </Eyebrow>

            <h2 className="mt-[14px] font-display font-extrabold text-[clamp(30px,4vw,48px)] leading-none tracking-tight text-fg-strong">
              How it (doesn&rsquo;t) work
            </h2>
          </div>

          {/* Right-aligned mono note */}
          <p className="max-w-[30ch] text-right font-mono text-2xs font-bold uppercase tracking-label text-fg-faint">
            FIVE STEPS. FOUR OF THEM REAL.
          </p>
        </div>

        {/* ── Five-step flex row ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-stretch gap-0">
          {STEPS.map((step, i) => {
            const isLast = i === STEPS.length - 1;
            // Connector before step 05 uses the accent "route" variant
            const connectorVariant = i === STEPS.length - 2 ? "route" : "default";

            return (
              <div key={step.num} className="contents">
                {/* Step card */}
                <div className="min-w-[170px] flex-1 basis-[180px] p-[6px_4px]">
                  {/* Number + icon row */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-accent">
                      {step.num}
                    </span>
                    {step.icon}
                  </div>

                  {/* Step title */}
                  {step.punchline ? (
                    <h3 className="mt-4 font-display text-[21px] font-extrabold leading-tight text-accent">
                      {step.label}
                    </h3>
                  ) : (
                    <h3 className="mt-4 font-display text-lg font-bold leading-tight text-fg-strong">
                      {step.label}
                    </h3>
                  )}

                  {/* Copy */}
                  <p className="mt-2 text-base leading-[1.45] text-fg-muted">
                    {step.copy}
                  </p>

                  {/* Stamp — punchline step only */}
                  {step.punchline && (
                    <div className="mt-4">
                      <Stamp label="NEVER ARRIVED" className="text-base" />
                    </div>
                  )}
                </div>

                {/* Perforation connector — not after the last step */}
                {!isLast && (
                  <div className="flex min-w-[34px] flex-none items-center self-start px-[6px] pt-[14px]">
                    <Perforation
                      variant={connectorVariant}
                      className="min-w-7 flex-1"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
