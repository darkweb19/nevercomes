import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show the dashed perforation tear-edge on the top of the card. Default: true. */
  perforated?: boolean;
  /** Lift the card off the page with a warm paper drop-shadow. Default: false. */
  raised?: boolean;
  /** Apply the default inner padding. Set false for media-bleed cards. Default: true. */
  padded?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className, perforated = true, raised = false, padded = true, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md bg-card",
        padded && "p-4",
        raised &&
          "shadow-[0_2px_4px_rgba(0,0,0,0.10),0_6px_16px_rgba(0,0,0,0.12)]",
        perforated && "perforation",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
