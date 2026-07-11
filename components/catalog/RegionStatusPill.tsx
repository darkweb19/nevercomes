"use client";

import { cn } from "@/lib/utils/cn";
import type { BrowsePhase } from "@/lib/catalog/region";

/**
 * Header pill showing the visitor's region + catalog readiness:
 *   cold    → "M5V · PREPARING" (gold, pulsing)
 *   filling → "M5V · INDEXED"   (gold, steady)
 *   warm    → "M5V · LIVE"      (muted)
 */
interface RegionStatusPillProps {
  region: string;
  phase: BrowsePhase;
}

const LABEL: Record<BrowsePhase, string> = {
  cold: "PREPARING",
  filling: "INDEXED",
  warm: "LIVE",
};

export function RegionStatusPill({ region, phase }: RegionStatusPillProps) {
  const warm = phase === "warm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill px-3 py-1.5",
        "font-mono text-2xs font-bold uppercase tracking-label",
        warm
          ? "bg-sunken text-fg-muted"
          : "bg-status-transit-wash text-status-transit",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 flex-none rounded-full",
          warm ? "bg-fg-muted" : "bg-status-transit",
        )}
        style={
          phase === "cold"
            ? { animation: "ncPulse 2.2s ease-in-out infinite" }
            : undefined
        }
        aria-hidden="true"
      />
      {region} &middot; {LABEL[phase]}
    </span>
  );
}
