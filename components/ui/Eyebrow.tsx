import { cn } from "@/lib/utils/cn";

export interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add a hairline rule under the label. */
  rule?: boolean;
}

/**
 * Mono, uppercase, wide-tracked micro-label — the "eyebrow" / stamp-label role
 * that sits above titles and on cards. Quiet by default; `rule` adds a tear-line.
 */
export function Eyebrow({ className, rule = false, ...props }: EyebrowProps) {
  return (
    <div
      className={cn(
        "font-mono text-2xs font-bold uppercase tracking-label text-fg-muted",
        rule && "border-b border-hairline pb-1",
        className,
      )}
      {...props}
    />
  );
}
