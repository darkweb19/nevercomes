"use client";

/**
 * Step progress rail for /checkout. Shows the current step label + a thin
 * progress bar. Exported `Step` type is the source-of-truth union used by the
 * entire checkout flow.
 */

export type Step = "location" | "payment" | "processing" | "done";

interface StepConfig {
  num: number;
  name: string;
  /** Progress bar fill percentage. */
  progress: number;
}

const CONFIG: Record<Step, StepConfig> = {
  location: { num: 1, name: "Delivery", progress: 33 },
  payment: { num: 2, name: "Payment", progress: 66 },
  processing: { num: 3, name: "Processing", progress: 90 },
  done: { num: 3, name: "Done", progress: 100 },
};

export function StepRail({ step }: { step: Step }) {
  const { num, name, progress } = CONFIG[step];
  const padded = String(num).padStart(2, "0");
  const label = `Step ${padded} of 03 · ${name}`;

  return (
    <div className="mb-8">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-2xs uppercase tracking-label text-fg-muted">
          {label}
        </span>
        <span className="font-mono text-2xs tabular-nums text-fg-faint">
          {padded} / 03
        </span>
      </div>
      {/* Progress bar — transition-all for smooth fill; degrades instantly under reduced-motion */}
      <div className="h-[2px] overflow-hidden rounded-pill bg-sunken">
        <div
          className="h-full rounded-pill bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}
