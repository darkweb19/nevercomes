/**
 * Pure geographic helpers for the simulation engine.
 *
 * No imports outside lib/sim (HARD RULE #4). No clock, no randomness, no I/O.
 * Results are deterministic for identical inputs.
 */

import type { LatLng } from "./types";

/** Earth mean radius in metres (WGS-84 approximation used by most map tools). */
const EARTH_RADIUS_M = 6_371_008.8;

/**
 * Haversine great-circle distance between two geographic points, in metres.
 *
 * Uses the standard haversine formula:
 *   a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
 *   c = 2·atan2(√a, √(1−a))
 *   d = R·c
 *
 * Returns 0 for identical points (handles the √0 case cleanly).
 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Linearly interpolate a position along a polyline route at parameter t ∈ [0, 1].
 *
 * t is clamped to [0, 1] before use. The walk is weighted by cumulative haversine
 * segment lengths, so a segment twice as long contributes twice the t range — the
 * position tracks real-world distance, not point count.
 *
 * Edge cases:
 * - Empty route → returns { lat: 0, lng: 0 } (step() never calls this for empty routes,
 *   but this avoids throwing).
 * - Single point → that point for any t.
 * - Zero-length segments (duplicate consecutive points) are skipped in the walk to
 *   avoid dividing by zero; they contribute no distance and no t range.
 */
export function interpolateAlongRoute(route: LatLng[], t: number): LatLng {
  if (route.length === 0) return { lat: 0, lng: 0 };
  if (route.length === 1) return { lat: route[0].lat, lng: route[0].lng };

  // Clamp t to [0, 1].
  const tc = Math.max(0, Math.min(1, t));

  // Build cumulative distance array. segLengths[i] = distance from route[i] to route[i+1].
  const segLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const d = haversineMeters(route[i], route[i + 1]);
    segLengths.push(d);
    totalLength += d;
  }

  // If the entire route has zero length (all duplicates), return the first point.
  if (totalLength === 0) return { lat: route[0].lat, lng: route[0].lng };

  // t = 1 must return exactly the last point (no floating-point overshoot).
  if (tc === 1) {
    const last = route[route.length - 1];
    return { lat: last.lat, lng: last.lng };
  }

  // Walk cumulative segments to find which segment contains tc * totalLength.
  const target = tc * totalLength;
  let accumulated = 0;

  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];

    // Skip zero-length segments — they have no t range and must not cause division by zero.
    if (segLen === 0) continue;

    if (accumulated + segLen >= target) {
      // tc falls within segment i. Linear-lerp lat and lng.
      const localT = (target - accumulated) / segLen;
      const p0 = route[i];
      const p1 = route[i + 1];
      return {
        lat: p0.lat + localT * (p1.lat - p0.lat),
        lng: p0.lng + localT * (p1.lng - p0.lng),
      };
    }

    accumulated += segLen;
  }

  // Fallback: floating-point rounding pushed us past the last segment — return last point.
  const last = route[route.length - 1];
  return { lat: last.lat, lng: last.lng };
}
