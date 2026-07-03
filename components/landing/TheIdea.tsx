import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * "THE (REAL) IDEA" section — a centered, max-680px block anchored by a 2px
 * dashed left border (var(--border-perf)). The anchor `#idea` is applied by
 * the parent page, not here.
 */
export function TheIdea() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-[1180px] flex justify-center px-[clamp(20px,5vw,56px)] py-[clamp(56px,8vw,112px)]">

        {/* Content block — 2px dashed left border (perf token) */}
        <div
          className="max-w-[680px] pl-[clamp(24px,4vw,44px)]"
          style={{ borderLeft: "2px dashed var(--border-perf)" }}
        >
          <Eyebrow className="text-fg-faint">THE (REAL) IDEA</Eyebrow>

          {/* Pull quote — display font, large */}
          <p
            className="mt-5 font-display font-medium leading-[1.35] tracking-[-0.01em] text-fg"
            style={{ fontSize: "clamp(22px,2.6vw,32px)" }}
          >
            Dopamine doesn&rsquo;t fire when the package lands. It fires while
            you&rsquo;re waiting for it. The anticipation is the high — the arrival
            is just the bill.
          </p>

          {/* Follow-up paragraph — muted body text */}
          <p
            className="mt-6 max-w-[54ch] leading-[1.55] text-fg-muted"
            style={{ fontSize: "clamp(16px,1.4vw,18px)" }}
          >
            NeverComes keeps you in the part that feels good and quietly deletes
            the part that doesn&rsquo;t. Nothing ships. Nothing is charged. The
            wanting was always the product.
          </p>

          {/* Sign-off */}
          <div className="mt-[26px] font-mono text-2xs font-bold uppercase tracking-label text-fg-faint">
            — THE SYSTEM VOICE
          </div>
        </div>
      </div>
    </section>
  );
}
