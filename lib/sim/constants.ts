/**
 * Simulation timing constants and stage boundary fractions.
 *
 * All stage windows are expressed as fractions of totalDurationMs so the
 * engine scales correctly when a custom duration is passed via SimConfig.
 * The boundaries below are derived from the spec's stage table (§Phase 6):
 *
 *   accepted  : 0     – 12.5%  of total  (courier not yet moving)
 *   preparing : 12.5% – 33%    of total  (still at origin)
 *   picked_up : 33%   – 79%    of total  (ramps progress 0 → ~0.85)
 *   nearby    : 79%   – 100%   of total  (ramps progress ~0.85 → PROGRESS_CAP)
 *   never     : ≥ 100%          (motion frozen, stamp shown)
 */

/** Default total duration of a simulated delivery run, in milliseconds. */
export const SIM_DURATION_MS = 120_000;

/**
 * Maximum progress value the courier ever reaches.
 * Strictly less than 1 — the courier stalls "nearby" and never arrives.
 */
export const PROGRESS_CAP = 0.92;

/** Fraction of total duration at which "accepted" ends and "preparing" begins. */
export const ACCEPTED_END = 0.125;

/** Fraction of total duration at which "preparing" ends and "picked_up" begins. */
export const PREPARING_END = 0.33;

/**
 * Fraction of total duration at which "picked_up" ends and "nearby" begins.
 * The courier has traveled PICKED_UP_PROGRESS_END of the route at this point.
 */
export const PICKED_UP_END = 0.79;

/**
 * Progress (route fraction) reached at the picked_up → nearby boundary.
 * The "nearby" stage then ramps this up to PROGRESS_CAP.
 */
export const PICKED_UP_PROGRESS_END = 0.85;
