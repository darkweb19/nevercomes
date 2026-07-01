import { describe, it, expect } from "vitest";
import { haversineMeters, interpolateAlongRoute } from "@/lib/sim/geo";
import type { LatLng } from "@/lib/sim/types";

// ---------------------------------------------------------------------------
// haversineMeters
// ---------------------------------------------------------------------------

const TORONTO: LatLng = { lat: 43.6532, lng: -79.3832 };
const MONTREAL: LatLng = { lat: 45.5019, lng: -73.5674 };

describe("haversineMeters", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMeters(TORONTO, TORONTO)).toBe(0);
  });

  it("measures Toronto → Montreal at roughly 504 km", () => {
    const d = haversineMeters(TORONTO, MONTREAL);
    expect(d).toBeGreaterThan(495_000);
    expect(d).toBeLessThan(515_000);
  });

  it("measures one degree of latitude at roughly 111.2 km", () => {
    const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110_500);
    expect(d).toBeLessThan(111_900);
  });

  it("is symmetric", () => {
    expect(haversineMeters(TORONTO, MONTREAL)).toBeCloseTo(
      haversineMeters(MONTREAL, TORONTO),
      6,
    );
  });
});

// ---------------------------------------------------------------------------
// interpolateAlongRoute
// ---------------------------------------------------------------------------

describe("interpolateAlongRoute", () => {
  const A: LatLng = { lat: 0, lng: 0 };
  const B: LatLng = { lat: 0, lng: 1 };
  const C: LatLng = { lat: 0, lng: 3 };

  it("returns the origin at t = 0", () => {
    expect(interpolateAlongRoute([A, C], 0)).toEqual(A);
  });

  it("returns the final point at t = 1", () => {
    expect(interpolateAlongRoute([A, B, C], 1)).toEqual(C);
  });

  it("lands halfway on a two-point route at t = 0.5", () => {
    const mid = interpolateAlongRoute([A, C], 0.5);
    expect(mid.lat).toBeCloseTo(0, 6);
    expect(mid.lng).toBeCloseTo(1.5, 3);
  });

  it("weights by segment length, not by point count", () => {
    // A→B is 1° of longitude, B→C is 2°: t = 1/3 of total distance lands on B.
    const p = interpolateAlongRoute([A, B, C], 1 / 3);
    expect(p.lat).toBeCloseTo(B.lat, 4);
    expect(p.lng).toBeCloseTo(B.lng, 3);
  });

  it("clamps t below 0 to the origin", () => {
    expect(interpolateAlongRoute([A, C], -0.5)).toEqual(A);
  });

  it("clamps t above 1 to the final point", () => {
    expect(interpolateAlongRoute([A, C], 1.7)).toEqual(C);
  });

  it("returns the sole point of a single-point route for any t", () => {
    expect(interpolateAlongRoute([B], 0)).toEqual(B);
    expect(interpolateAlongRoute([B], 0.5)).toEqual(B);
    expect(interpolateAlongRoute([B], 1)).toEqual(B);
  });

  it("handles a route with duplicated (zero-length) segments", () => {
    // Zero-length segment A→A must not divide by zero or stall the walk.
    const p = interpolateAlongRoute([A, A, C], 0.5);
    expect(p.lat).toBeCloseTo(0, 6);
    expect(p.lng).toBeCloseTo(1.5, 3);
  });
});
