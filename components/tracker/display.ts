/**
 * Pure display helpers for the tracker UI.
 *
 * No React, no DOM, no Supabase — these are deterministic transformations of
 * sim state into display values. Unit-tested in tests/unit/tracker-display.test.ts.
 */

// Deep import from lib/sim/constants is intentional: these are compile-time
// constants (stage fractions + total duration) the UI needs to compute display
// timestamps. The barrel (@/lib/sim) only re-exports SIM_DURATION_MS and
// PROGRESS_CAP; PREPARING_END lives in the sub-module and is not in the barrel.
import { PREPARING_END, SIM_DURATION_MS } from "@/lib/sim/constants";
import type { SimStatus } from "@/lib/sim/types";

// ── Row state ────────────────────────────────────────────────────────────────

/** Visual state for a single timeline row. */
export type RowState = "done" | "active" | "pending" | "never";

/** States for all five timeline rows derived from a single SimStatus. */
export interface TimelineRowStates {
  accepted: RowState;
  preparing: RowState;
  picked_up: RowState;
  nearby: RowState;
  /** Always "never" — the Delivered row is the payoff and never resolves. */
  delivered: RowState;
}

/**
 * The ordered progress sequence of the four active rows (excluding "delivered").
 * "never" is the terminal sim state that maps "nearby" to active (stall behavior).
 */
const ROW_KEYS = ["accepted", "preparing", "picked_up", "nearby"] as const;
type RowKey = (typeof ROW_KEYS)[number];

/** Sim-status → index in the row sequence (for done/active/pending logic). */
const STATUS_TO_ACTIVE_IDX: Record<SimStatus, number> = {
  accepted: 0,
  preparing: 1,
  picked_up: 2,
  nearby: 3,
  // "never" is the terminal stall state: the courier is frozen "nearby".
  // Per design stall behavior, the "nearby" row stays active — not done.
  never: 3,
};

/**
 * Map a SimStatus to the display state for each of the 5 timeline rows.
 *
 * Invariants:
 * - `delivered` is ALWAYS "never" — no sim status can make it done or active.
 * - When status is "never" (terminal), `nearby` stays "active" (stall behavior).
 */
export function statusToRowStates(status: SimStatus): TimelineRowStates {
  const activeIdx = STATUS_TO_ACTIVE_IDX[status];

  const rowStates = ROW_KEYS.reduce(
    (acc, key, i) => {
      let state: RowState;
      if (i < activeIdx) state = "done";
      else if (i === activeIdx) state = "active";
      else state = "pending";
      acc[key] = state;
      return acc;
    },
    {} as Record<RowKey, RowState>,
  );

  return {
    ...rowStates,
    delivered: "never",
  };
}

// ── Stage timestamps ─────────────────────────────────────────────────────────

/**
 * Format a Date as a 12-hour time string ("12:02 AM" style, en-CA locale).
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Compute the display timestamps for the "Accepted" and "Picked up" rows.
 *
 * - Accepted timestamp = order's created_at (the moment the order was placed).
 * - Picked-up timestamp = created_at + PREPARING_END × SIM_DURATION_MS
 *   (the point where preparing ends and the courier picks up the order).
 */
export function stageTimes(createdAtIso: string): {
  accepted: string;
  pickedUp: string;
} {
  const createdAt = new Date(createdAtIso);
  const pickedUpAt = new Date(
    createdAt.getTime() + PREPARING_END * SIM_DURATION_MS,
  );
  return {
    accepted: formatTime(createdAt),
    pickedUp: formatTime(pickedUpAt),
  };
}

// ── ETA cycle ────────────────────────────────────────────────────────────────

/**
 * The stall-mode ETA display loop (from the design's "stall" behavior reference).
 * Ticks every 2600ms while the courier is active. Repeats indefinitely.
 */
export const ETA_SEQUENCE = [
  "2 min away",
  "2 min away",
  "Almost there",
  "1 min away",
  "Recalculating…",
  "2 min away",
  "2 min away",
  "1 min away",
  "Recalculating…",
] as const;

/**
 * Return the ETA display string for a given (monotonically increasing) tick index.
 * Deterministic: same index always returns the same label.
 */
export function etaAt(tickIndex: number): string {
  return ETA_SEQUENCE[tickIndex % ETA_SEQUENCE.length];
}
