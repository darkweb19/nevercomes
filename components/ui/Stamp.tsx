import { cn } from "@/lib/utils/cn";

export interface StampProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The stamped text. Defaults to the signature payoff. */
  label?: string;
}

/**
 * The signature rubber-stamp mark — "NEVER ARRIVED" by default.
 *
 * Intentionally static (slight fixed rotation, low-ink border), so there is no
 * animation for `prefers-reduced-motion` to degrade. The Phase 7 tracker uses
 * this as the never-delivered payoff.
 */
export function Stamp({
  label = "NEVER ARRIVED",
  className,
  ...props
}: StampProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "inline-block -rotate-6 select-none rounded-sm border-2 border-stamp px-3 py-1",
        "font-display text-lg font-bold uppercase tracking-widest text-stamp opacity-80",
        className,
      )}
      {...props}
    >
      {label}
    </div>
  );
}
