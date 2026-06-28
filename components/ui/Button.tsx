import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "sm" | "md";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  // The one bold accent: stamp-red CTA on paper.
  primary: "bg-stamp text-paper hover:bg-stamp/90 border border-stamp",
  // Quiet: ink on paper with a perforation-toned border.
  ghost: "bg-transparent text-ink border border-rule hover:bg-paper-2",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-label",
  md: "h-10 px-4 text-body",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-mono uppercase tracking-wide transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
