"use client";

/**
 * Step 03 (final) — Done.
 * Confirms the order and offers two escapes: View tracking → /track/:orderId,
 * Order again → resets the flow. The stamped paper receipt lives alongside this
 * in the parent's right column.
 */

import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

interface DoneStepProps {
  /** Full UUID order ID — used for the tracking link. */
  orderId: string;
  /** Short display form e.g. NC-F47AC1. */
  orderIdShort: string;
  onViewTracking: () => void;
  onOrderAgain: () => void;
}

export function DoneStep({
  orderId,
  orderIdShort,
  onViewTracking,
  onOrderAgain,
}: DoneStepProps) {
  return (
    <div className="min-w-0 flex-[3_1_520px]">
      <Eyebrow>Step 03 / Done</Eyebrow>

      <h1 className="mb-3 mt-3 font-display text-3xl font-extrabold tracking-tight text-fg-strong">
        It&rsquo;s official.
      </h1>

      <p className="mb-8 max-w-[52ch] text-base leading-relaxed text-fg-muted">
        Order {orderIdShort} is confirmed. It will now begin not arriving.
      </p>

      {/* Tracking number block */}
      <div className="mb-8 rounded-md border border-hairline bg-card p-4">
        <div className="mb-1.5 font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
          Tracking number
        </div>
        <div className="font-mono text-sm tabular-nums text-fg-strong">
          {orderId}
        </div>
        <div className="mt-1.5 font-mono text-2xs text-fg-faint">
          Use this to follow the dot that never reaches you.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" size="lg" onClick={onViewTracking}>
          View tracking
        </Button>
        <Button variant="secondary" size="lg" onClick={onOrderAgain}>
          Order again
        </Button>
      </div>
    </div>
  );
}
