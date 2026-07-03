"use client";

/**
 * EtaTicker — cycles through the ETA label sequence every 2400 ms.
 *
 * Sequence: ["7 min","6 min","5 min","4 min","3 min","2 min","Recalculating…",
 *            "3 min","2 min","Recalculating…","2 min","Almost there","Recalculating…"]
 * After the last item (index 12), loop back to index 6 ("Recalculating…").
 *
 * The ncEtaFlip animation (already defined in globals.css) is replayed by
 * keying the inner span on the *display string* — this prevents a spurious
 * re-trigger on the loop-back when consecutive labels are identical (index 6
 * and the wrap target are both "Recalculating…").
 *
 * SSR-safe: renders index 0 ("7 min") with no timers until mounted.
 * Reduced motion: the animation collapses to 0.01 ms via the global CSS rule;
 * the label still advances (it is still readable text, not purely decorative).
 */

import { useEffect, useState } from "react";

const ETA_SEQUENCE = [
  "7 min",
  "6 min",
  "5 min",
  "4 min",
  "3 min",
  "2 min",
  "Recalculating…",
  "3 min",
  "2 min",
  "Recalculating…",
  "2 min",
  "Almost there",
  "Recalculating…",
] as const;

const TICK_MS = 2400;

export function EtaTicker() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev >= 12 ? 6 : prev + 1));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const label = ETA_SEQUENCE[idx];

  return (
    <span
      key={label}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "18px",
        fontWeight: 700,
        color: "var(--status-transit)",
        display: "block",
        animation: "ncEtaFlip var(--dur-base) var(--ease-out)",
      }}
    >
      {label}
    </span>
  );
}
