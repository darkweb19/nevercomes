import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show the dashed perforation tear-edge on the top of the card. Default: true. */
  perforated?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, perforated = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md bg-card p-4",
        perforated && "perforation",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
