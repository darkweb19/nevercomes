import { cn } from "@/lib/utils/cn";

export type StatusPillVariant = "transit" | "never";

export interface StatusPillProps {
  /** "transit" → gold "IN TRANSIT" pill; "never" → stamp-red "NEVER ARRIVED" pill. */
  variant: StatusPillVariant;
  /**
   * Show an animated pulse dot beside the label (transit variant only).
   * Disabled when the user prefers reduced motion — pass `false` in that case.
   */
  pulse?: boolean;
  className?: string;
}

/**
 * Mono-uppercase micro-pill showing courier status.
 * Two variants: in-transit (gold) and never-arrived (stamp red).
 */
export function StatusPill({ variant, pulse = false, className }: StatusPillProps) {
  const isTransit = variant === "transit";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1",
        "font-mono text-2xs font-bold uppercase tracking-label",
        isTransit
          ? "bg-status-transit-wash text-status-transit"
          : "bg-accent-wash text-accent",
        className,
      )}
    >
      {isTransit && pulse && (
        <span
          className="inline-block h-1.5 w-1.5 flex-none rounded-full bg-status-transit"
          style={{ animation: "ncPulse 1.6s ease-in-out infinite" }}
          aria-hidden="true"
        />
      )}
      {isTransit ? "IN TRANSIT" : "NEVER ARRIVED"}
    </span>
  );
}
