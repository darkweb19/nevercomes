/**
 * Deterministic live counters — the simulated "heartbeat" numbers shown on the
 * landing social-proof strip.
 *
 * Pure module: no React, no DOM, no network, no Supabase.
 * Same rules as lib/sim — same input always produces the same output.
 */

/** FNV-1a 32-bit hash — tiny, stable, well-distributed. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ─── Exported constants (tests and UI share these — no magic numbers) ──────────

/** Hard lower bound for shoppersNow. */
export const SHOPPERS_MIN = 140;
/** Hard upper bound for shoppersNow. */
export const SHOPPERS_MAX = 1_500;

/**
 * Midpoint of the diurnal shoppers curve (~620 is a plausible quiet-hour floor
 * for a niche novelty site with global spread).
 */
export const SHOPPERS_MID = 620;

/**
 * Amplitude of the diurnal sine wave. Peak = MID + AMP = 890, trough = MID − AMP = 350.
 * Both stay well inside [SHOPPERS_MIN, SHOPPERS_MAX] even before jitter.
 */
export const SHOPPERS_AMP = 270;

/**
 * UTC hour at which traffic peaks (15 = 3 PM UTC — catches European afternoon
 * and US-East morning overlap).
 */
export const SHOPPERS_PEAK_HOUR = 15;

/**
 * Maximum shoppers jitter added/subtracted per 4s bucket (±50).
 * Smooth curve range [350, 890] + jitter [−50, 50] → [300, 940] ⊂ [140, 1500].
 */
export const SHOPPERS_JITTER = 50;

/**
 * NeverComes launch epoch — ordersInTransit anchors here.
 * 2025-01-01T00:00:00Z (Unix ms).
 */
export const LAUNCH_EPOCH_MS = 1_735_689_600_000;

/**
 * Seed count of orders already "in transit" at launch (pre-launch beta accumulation).
 */
export const TRANSIT_SEED = 847;

/**
 * Orders entering transit per hour.  They accumulate forever because nothing
 * is ever delivered.  At ~2.8/hour = ~67/day.
 *
 * Monotonic-growth guarantee: 24h growth (≥67) > 2 × TRANSIT_JITTER (30),
 * so ordersInTransit(t + 24h) > ordersInTransit(t) holds for all t, regardless
 * of which jitter bucket each lands in.
 */
export const TRANSIT_GROWTH_PER_HOUR = 2.8;

/**
 * Maximum transit jitter added/subtracted per 4s bucket (±15).
 * Kept small relative to 24h growth (67) to preserve day-scale monotonicity.
 */
export const TRANSIT_JITTER = 15;

// ─── Public types ─────────────────────────────────────────────────────────────

export interface LiveCounters {
  /** Approximate number of shoppers active on the site right now. */
  shoppersNow: number;
  /**
   * Orders currently in transit — accumulate forever, delivered never.
   * Net-increasing over any span ≥ 1 day.
   */
  ordersInTransit: number;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Returns deterministic live-counter values for the given timestamp.
 *
 * @param nowMs - Current Unix timestamp in milliseconds.
 */
export function countersAt(nowMs: number): LiveCounters {
  // 4-second bucket index — shared by both counters for a synchronised tick
  const bucket = Math.floor(nowMs / 4_000);

  // ── shoppersNow ────────────────────────────────────────────────────────────
  // Smooth diurnal sine wave (period 24 h) centred on SHOPPERS_MID.
  // sin((h − (PEAK − 6)) × π/12) reaches +1 at h = PEAK_HOUR.
  const msInDay = nowMs % (24 * 3_600_000);
  const utcHourFrac = msInDay / 3_600_000;
  const smooth =
    SHOPPERS_MID +
    SHOPPERS_AMP *
      Math.sin(((utcHourFrac - (SHOPPERS_PEAK_HOUR - 6)) * Math.PI) / 12);

  const shopHash = fnv1a(String(bucket));
  const shopJitter = (shopHash % (2 * SHOPPERS_JITTER + 1)) - SHOPPERS_JITTER;
  const shoppersNow = Math.max(
    SHOPPERS_MIN,
    Math.min(SHOPPERS_MAX, Math.round(smooth) + shopJitter),
  );

  // ── ordersInTransit ────────────────────────────────────────────────────────
  // Linear growth from launch epoch + bounded per-bucket jitter.
  // elapsedMs is clamped to ≥ 0 so pre-launch timestamps return the seed value.
  const elapsedMs = Math.max(0, nowMs - LAUNCH_EPOCH_MS);
  const elapsedHours = elapsedMs / 3_600_000;
  const transitBase =
    TRANSIT_SEED + Math.floor(elapsedHours * TRANSIT_GROWTH_PER_HOUR);
  const transitHash = fnv1a(String(bucket) + "|t");
  const transitJitter =
    (transitHash % (2 * TRANSIT_JITTER + 1)) - TRANSIT_JITTER;
  const ordersInTransit = Math.max(0, transitBase + transitJitter);

  return { shoppersNow, ordersInTransit };
}
