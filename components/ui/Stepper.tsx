"use client";

import { cn } from "@/lib/utils/cn";

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Accessible label for the control group. */
  "aria-label"?: string;
  className?: string;
}

/**
 * Quantity −/+ stepper. Keyboard-operable (native buttons), clamps to [min, max].
 * Presentational + controlled — the value lives with the caller.
 */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  "aria-label": ariaLabel = "Quantity",
  className,
}: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const dec = () => onChange(clamp(value - 1));
  const inc = () => onChange(clamp(value + 1));

  const btn =
    "flex h-10 w-10 items-center justify-center text-fg-strong transition-colors hover:bg-sunken disabled:pointer-events-none disabled:opacity-40";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-md border border-hairline bg-card",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={btn}
      >
        <span aria-hidden="true">−</span>
      </button>
      <span
        aria-live="polite"
        className="min-w-[2ch] text-center font-mono text-base font-bold tabular-nums text-fg-strong"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={btn}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
