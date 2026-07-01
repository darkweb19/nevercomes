/**
 * Pure simulation step function — the heart of the NeverComes courier engine.
 *
 * `step(config, elapsedMs)` is a pure function: same inputs always produce an
 * identical SimFrame. No clock, no randomness, no I/O. The React layer (Phase 7)
 * computes elapsedMs from the order's created_at timestamp and calls this inside
 * requestAnimationFrame.
 *
 * The product invariant encoded here: the courier NEVER arrives. The `never`
 * status is terminal and motion freezes at PROGRESS_CAP (< 1), ensuring the
 * haversine distance to the destination is always > 0. `hasArrived` is the
 * literal `false` in the type; it cannot be set to true.
 */

import type { SimConfig, SimFrame, SimStatus } from "./types";
import { interpolateAlongRoute } from "./geo";
import {
  SIM_DURATION_MS,
  PROGRESS_CAP,
  ACCEPTED_END,
  PREPARING_END,
  PICKED_UP_END,
  PICKED_UP_PROGRESS_END,
} from "./constants";

/** Fallback position when the route is empty — step must not throw. */
const EMPTY_ROUTE_FALLBACK = { lat: 0, lng: 0 };

/**
 * Compute a single SimFrame for the given elapsed time.
 *
 * @param config - Route points and optional custom duration.
 * @param elapsedMs - Milliseconds since the order was created. Clamped to ≥ 0.
 * @returns A SimFrame snapshot. hasArrived is always false.
 */
export function step(config: SimConfig, elapsedMs: number): SimFrame {
  const total = config.totalDurationMs ?? SIM_DURATION_MS;
  const elapsed = Math.max(0, elapsedMs);

  // -------------------------------------------------------------------------
  // Past the cap: freeze everything. All frames past totalDurationMs are
  // derived purely from constants so they are guaranteed deep-equal.
  // -------------------------------------------------------------------------
  if (elapsed >= total) {
    const position =
      config.route.length > 0
        ? interpolateAlongRoute(config.route, PROGRESS_CAP)
        : { ...EMPTY_ROUTE_FALLBACK };

    return {
      status: "never" as SimStatus,
      progress: PROGRESS_CAP,
      position,
      etaLabel: "Never",
      hasArrived: false,
      stamped: true,
    };
  }

  // -------------------------------------------------------------------------
  // In transit: compute fraction f ∈ [0, 1) and map to stage + progress.
  // -------------------------------------------------------------------------
  const f = elapsed / total;

  let status: SimStatus;
  let progress: number;

  if (f < ACCEPTED_END) {
    // Courier accepted the order but hasn't started cooking/preparing yet.
    status = "accepted";
    progress = 0;
  } else if (f < PREPARING_END) {
    // Vendor is preparing the order; courier is still at origin.
    status = "preparing";
    progress = 0;
  } else if (f < PICKED_UP_END) {
    // Courier picked up and is en route. Progress ramps 0 → PICKED_UP_PROGRESS_END
    // linearly across the picked_up window [PREPARING_END, PICKED_UP_END).
    status = "picked_up";
    const windowLen = PICKED_UP_END - PREPARING_END;
    const windowPos = f - PREPARING_END;
    progress = (windowPos / windowLen) * PICKED_UP_PROGRESS_END;
  } else {
    // Courier is "nearby" — tantalizingly close but perpetually stalled.
    // Progress ramps PICKED_UP_PROGRESS_END → PROGRESS_CAP across [PICKED_UP_END, 1).
    status = "nearby";
    const windowLen = 1 - PICKED_UP_END;
    const windowPos = f - PICKED_UP_END;
    const rawProgress =
      PICKED_UP_PROGRESS_END +
      (windowPos / windowLen) * (PROGRESS_CAP - PICKED_UP_PROGRESS_END);
    // Clamp to PROGRESS_CAP so the ramp endpoint never overshoots due to floating-point.
    progress = Math.min(rawProgress, PROGRESS_CAP);
  }

  // -------------------------------------------------------------------------
  // Position: interpolate along the route polyline at the current progress.
  // progress = 0 → route[0] (origin), which is exactly what interpolateAlongRoute
  // returns for t = 0. Empty route falls back without throwing.
  // -------------------------------------------------------------------------
  const position =
    config.route.length > 0
      ? interpolateAlongRoute(config.route, progress)
      : { ...EMPTY_ROUTE_FALLBACK };

  return {
    status,
    progress,
    position,
    etaLabel: "~2 min away",
    hasArrived: false,
    stamped: false,
  };
}
