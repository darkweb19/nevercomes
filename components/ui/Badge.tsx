import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "ok" | "warn" | "stamp";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: "border-hairline text-fg-faint",
  ok: "border-ok text-ok",
  warn: "border-warn text-warn",
  stamp: "border-accent text-accent",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5",
        "font-mono text-xs uppercase tracking-wider",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
