import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to fill the container width. */
  block?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  // The one bold accent: stamp-red CTA.
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover border border-accent",
  // Bordered surface — quiet but present (filters, secondary actions).
  secondary: "bg-card text-fg-strong border border-hairline hover:bg-sunken",
  // Quietest: transparent with a perforation-toned border.
  ghost: "bg-transparent text-fg-strong border border-hairline hover:bg-sunken",
  // Destructive / "declare it lost" — stamp-red fill, paper text.
  danger: "bg-stamp-600 text-paper-000 hover:bg-stamp-700 border border-stamp-600",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-14 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", block = false, type, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-mono uppercase tracking-wide transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
