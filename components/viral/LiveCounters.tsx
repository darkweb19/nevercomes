"use client";

import { useState, useEffect } from "react";
import { countersAt, SHOPPERS_MID, TRANSIT_SEED } from "@/lib/viral/counters";

/**
 * Constant initial state used on the first (server) render.
 * Must stay stable across SSR and client hydration to avoid a mismatch.
 */
const SSR_COUNTERS = {
  shoppersNow: SHOPPERS_MID,     // 620 — diurnal midpoint
  ordersInTransit: TRANSIT_SEED, // 847 — launch-day seed
};

/**
 * LiveCounters — three-cell social-proof strip for the landing page.
 *
 * Cells:
 *  1. SHOPPING RIGHT NOW — green pulsing dot + shoppersNow (fg-strong)
 *  2. ORDERS NEVER ARRIVING — amber pulsing dot + ordersInTransit (status-transit)
 *  3. DELIVERED, EVER — static "0" in accent; no dot, no tick
 *
 * Cadence: ~4.2 s (calm heartbeat, not a slot machine).
 *
 * Reduced motion: pulsing dots are hidden by motion-safe:animate-pulse so they
 * become static; numbers still update on each interval tick.
 * Accessibility: dots carry aria-hidden — they are decorative; the counters
 * themselves are not wrapped in aria-live to avoid screen-reader spam.
 */
export function LiveCounters() {
  const [counters, setCounters] = useState(SSR_COUNTERS);

  useEffect(() => {
    // First render uses SSR_COUNTERS; the interval updates to the real value
    // on every tick (~4.2 s cadence). setState is only called inside the
    // interval callback to satisfy the lint rule against direct-body setState.
    const id = setInterval(() => {
      setCounters(countersAt(Date.now()));
    }, 4_200);

    return () => clearInterval(id);
  }, []);

  const { shoppersNow, ordersInTransit } = counters;

  return (
    <div className="flex gap-px overflow-hidden rounded border border-hairline bg-hairline">
      {/* ── Cell 1: SHOPPING RIGHT NOW ─────────────────────────────────────── */}
      <div
        className="flex-1 basis-60 bg-page"
        style={{ padding: "clamp(20px, 3vw, 28px) clamp(20px, 3vw, 28px)" }}
      >
        <div className="font-mono text-2xs font-bold uppercase tracking-label text-fg-faint">
          Shopping right now
        </div>
        <div className="mt-1.5 flex items-center gap-2.5">
          <span
            className="inline-block h-2 w-2 flex-none rounded-full bg-ok motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <span className="font-mono font-bold leading-none text-fg-strong tabular-nums" style={{ fontSize: "26px" }}>
            {shoppersNow.toLocaleString("en-US")}
          </span>
        </div>
      </div>

      {/* ── Cell 2: ORDERS NEVER ARRIVING ──────────────────────────────────── */}
      <div
        className="flex-1 basis-60 bg-page"
        style={{ padding: "clamp(20px, 3vw, 28px) clamp(20px, 3vw, 28px)" }}
      >
        <div className="font-mono text-2xs font-bold uppercase tracking-label text-fg-faint">
          Orders never arriving
        </div>
        <div className="mt-1.5 flex items-center gap-2.5">
          <span
            className="inline-block h-2 w-2 flex-none rounded-full bg-status-transit motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <span className="font-mono font-bold leading-none text-status-transit tabular-nums" style={{ fontSize: "26px" }}>
            {ordersInTransit.toLocaleString("en-US")}
          </span>
        </div>
      </div>

      {/* ── Cell 3: DELIVERED, EVER (static) ───────────────────────────────── */}
      <div
        className="flex-1 basis-60 bg-page"
        style={{ padding: "clamp(20px, 3vw, 28px) clamp(20px, 3vw, 28px)" }}
      >
        <div className="font-mono text-2xs font-bold uppercase tracking-label text-accent">
          Delivered, ever
        </div>
        <div className="mt-1.5">
          <span className="font-mono font-bold leading-none text-accent tabular-nums" style={{ fontSize: "26px" }}>
            0
          </span>
        </div>
      </div>
    </div>
  );
}
