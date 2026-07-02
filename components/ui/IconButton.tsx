import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type IconButtonVariant = "ghost" | "outline";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  /** Required: describes the button action for screen readers. */
  "aria-label": string;
}

const variants: Record<IconButtonVariant, string> = {
  // Transparent, no border — the lightest possible icon action.
  ghost: "bg-transparent border border-transparent hover:bg-sunken",
  // Subtle hairline border — slightly more prominent.
  outline: "bg-transparent border border-hairline hover:bg-sunken",
};

/**
 * Square icon button (~36px) with ghost or outline variants.
 *
 * `aria-label` is required — icon buttons have no visible text label and must
 * describe their action for assistive technology.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
