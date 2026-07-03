import { cn } from "@/lib/utils/cn";

export type PerforationVariant = "default" | "route";

export interface PerforationProps {
  /**
   * "route" uses accent (stamp-red) tones and a heavier dash — the courier
   * route motif. "default" uses the standard hairline border.
   */
  variant?: PerforationVariant;
  /** Optional centered mono-uppercase label (e.g. "Route", "Route abandoned"). */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Horizontal dashed perforation rule, optionally with a centred label.
 *
 * Reuses the `.perforation` / `.nc-perf` concept from the design system.
 * "route" variant echoes the stamp-red dashed route line on the tracking map.
 */
export function Perforation({
  variant = "default",
  label,
  className,
  style,
}: PerforationProps) {
  const lineClass = cn(
    "border-0 border-t border-dashed",
    variant === "route"
      ? "border-accent opacity-70"
      : "border-hairline",
  );

  if (!label) {
    return (
      <hr
        className={cn(lineClass, className)}
        style={style}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn("relative flex items-center gap-3", className)}
      style={style}
      aria-hidden="true"
    >
      <hr className={cn(lineClass, "flex-1")} />
      <span
        className={cn(
          "flex-none font-mono text-2xs font-bold uppercase tracking-label",
          variant === "route" ? "text-accent" : "text-fg-muted",
        )}
      >
        {label}
      </span>
      <hr className={cn(lineClass, "flex-1")} />
    </div>
  );
}
