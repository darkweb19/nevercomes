"use client";

/**
 * Step 03 — Processing.
 *
 * Shows a thermal-receipt "printing" animation while the order request runs.
 * All motion is CSS-keyframe-based and degrades automatically under the global
 * `prefers-reduced-motion: reduce` rule in globals.css (duration collapses to
 * 0.01ms, fill-mode: both shows the final state immediately).
 *
 * Stagger map (the `both` fill-mode keeps each line hidden until its delay):
 *   0.15s  "NEVERCOMES GENERAL STORE"
 *   0.50s  "NeverComes · {orderIdShort}"
 *   0.85s  "Total charged $0.00"
 *   1.20s  "Status ACCEPTED"
 *   1.55s  "Authorizing $0.00 with the void…"
 *   1.90s  divider
 *   2.20s  ORDER PLACED stamp
 */

import { Eyebrow } from "@/components/ui/Eyebrow";
import { Stamp } from "@/components/ui/Stamp";

interface ProcessingStepProps {
  /** Short-form order ID (e.g. NC-F47AC1), or null while the request is in flight. */
  orderIdShort: string | null;
}

const LINE_STYLE = (delay: number): React.CSSProperties => ({
  animation: `ncReceiptLine 0.35s ease-out ${delay}s both`,
});

export function ProcessingStep({ orderIdShort }: ProcessingStepProps) {
  return (
    <div className="py-6">
      <Eyebrow>Step 03 / Processing</Eyebrow>

      <div className="mt-8 flex flex-col items-center">
        {/* Thermal slip */}
        <div className="theme-light w-full max-w-[340px]">
          <div className="nc-tear-top" aria-hidden="true" />

          <div
            className="bg-paper-100 px-8 py-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
            aria-live="polite"
            aria-label="Processing your order"
          >
            {/* Store header */}
            <div
              style={LINE_STYLE(0.15)}
              className="font-mono text-2xs font-bold uppercase tracking-label text-ink-500"
            >
              NEVERCOMES GENERAL STORE
            </div>

            <div
              style={LINE_STYLE(0.5)}
              className="mt-3 font-mono text-sm font-bold text-ink-900"
            >
              NeverComes &middot; {orderIdShort ?? "––––––"}
            </div>

            <div
              style={LINE_STYLE(0.85)}
              className="mt-2 font-mono text-xs text-ink-600"
            >
              Total charged $0.00
            </div>

            <div
              style={LINE_STYLE(1.2)}
              className="mt-1.5 font-mono text-xs font-bold uppercase tracking-wide text-ink-700"
            >
              Status ACCEPTED
            </div>

            <div
              style={LINE_STYLE(1.55)}
              className="mt-1.5 font-mono text-xs text-ink-500"
            >
              Authorizing $0.00 with the void&hellip;
            </div>

            <hr
              style={LINE_STYLE(1.9)}
              className="my-5 border-0 border-t border-dashed border-ink-400"
            />

            {/* Stamp slamming in */}
            <div
              style={{
                animation: "ncStampSlam 0.45s cubic-bezier(0.22,0.61,0.36,1) 2.2s both",
              }}
              className="flex justify-center"
            >
              <Stamp label="Order placed" />
            </div>
          </div>

          <div className="nc-tear-bottom" aria-hidden="true" />
        </div>

        {/* "Printing your receipt" with blinking cursor */}
        <div className="mt-5 font-mono text-xs text-fg-faint">
          Printing your receipt
          <span
            aria-hidden="true"
            style={{ animation: "ncCursorBlink 1s step-start infinite" }}
          >
            _
          </span>
        </div>
      </div>
    </div>
  );
}
