import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "ok" | "warn" | "stamp";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: "border-rule text-ink-faded",
  ok: "border-ok text-ok",
  warn: "border-warn text-warn",
  stamp: "border-stamp text-stamp",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5",
        "font-mono text-micro uppercase tracking-wider",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
