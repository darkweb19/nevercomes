"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which edge the panel slides in from. Default: "right". */
  side?: "right" | "left";
  children: React.ReactNode;
  className?: string;
  /** Accessible label for the dialog when there's no visible heading. */
  "aria-label"?: string;
}

/**
 * Controlled slide-in drawer. Presentational + keyboard-safe:
 * - Esc closes; overlay click closes.
 * - Focus moves into the panel on open and is restored to the trigger on close.
 * - The slide uses a CSS transition, which the global reduced-motion reset
 *   (app/globals.css) collapses to ~instant — no slide for those users.
 *
 * Side effects (data, body-scroll lock policy) belong in hooks/callers, not here.
 */
export function Sheet({
  open,
  onOpenChange,
  side = "right",
  children,
  className,
  "aria-label": ariaLabel,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    lastFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lastFocused.current?.focus?.();
    };
  }, [open, onOpenChange]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        onClick={() => onOpenChange(false)}
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={cn(
          "absolute top-0 h-full w-full max-w-sm bg-paper p-6 shadow-xl outline-none",
          "transition-transform duration-200 ease-out",
          side === "right" ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : side === "right"
              ? "translate-x-full"
              : "-translate-x-full",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
