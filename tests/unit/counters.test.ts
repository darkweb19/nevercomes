import { describe, it, expect } from "vitest";
import {
  countersAt,
  LAUNCH_EPOCH_MS,
  SHOPPERS_MIN,
  SHOPPERS_MAX,
} from "../../lib/viral/counters";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

describe("countersAt", () => {
  // ── Determinism ────────────────────────────────────────────────────────────
  describe("determinism", () => {
    it("returns equal results for two calls with the same timestamp", () => {
      const t = LAUNCH_EPOCH_MS + 7 * HOUR_MS;
      const a = countersAt(t);
      const b = countersAt(t);
      expect(a.shoppersNow).toBe(b.shoppersNow);
      expect(a.ordersInTransit).toBe(b.ordersInTransit);
    });

    it("returns equal results at a later arbitrary timestamp", () => {
      const t = 1_751_760_000_000; // 2025-07-05 12:00 UTC
      expect(countersAt(t)).toEqual(countersAt(t));
    });
  });

  // ── shoppersNow hard bounds ────────────────────────────────────────────────
  describe("shoppersNow hard bounds", () => {
    it("stays within [SHOPPERS_MIN, SHOPPERS_MAX] across a 30-day sweep at 17-min steps", () => {
      const step = 17 * 60 * 1_000; // 17 minutes in ms
      const end = LAUNCH_EPOCH_MS + 30 * DAY_MS;

      for (let t = LAUNCH_EPOCH_MS; t <= end; t += step) {
        const { shoppersNow } = countersAt(t);
        expect(shoppersNow).toBeGreaterThanOrEqual(SHOPPERS_MIN);
        expect(shoppersNow).toBeLessThanOrEqual(SHOPPERS_MAX);
      }
    });
  });

  // ── ordersInTransit day-scale monotonic growth ─────────────────────────────
  describe("ordersInTransit day-scale monotonic growth", () => {
    it("ordersInTransit(t + 24h) > ordersInTransit(t) for every step in a 30-day sweep", () => {
      const step = 17 * 60 * 1_000;
      const end = LAUNCH_EPOCH_MS + 30 * DAY_MS;

      for (let t = LAUNCH_EPOCH_MS; t <= end; t += step) {
        const today = countersAt(t).ordersInTransit;
        const tomorrow = countersAt(t + DAY_MS).ordersInTransit;
        expect(tomorrow).toBeGreaterThan(today);
      }
    });
  });

  // ── 4-second bucket jitter ─────────────────────────────────────────────────
  describe("4-second bucket jitter", () => {
    it("returns the same shoppersNow for two timestamps within the same 4s bucket", () => {
      // 100 ms apart — well inside a 4s window
      const t = LAUNCH_EPOCH_MS + 12 * HOUR_MS;
      expect(countersAt(t).shoppersNow).toBe(countersAt(t + 100).shoppersNow);
    });

    it("shoppersNow values change across at least 8 of 10 consecutive 4s bucket pairs", () => {
      const base = LAUNCH_EPOCH_MS + 12 * HOUR_MS;
      let diffCount = 0;
      for (let i = 0; i < 10; i++) {
        const t = base + i * 4_000;
        const tNext = t + 4_000;
        if (countersAt(t).shoppersNow !== countersAt(tNext).shoppersNow) {
          diffCount++;
        }
      }
      // FNV-1a hash of consecutive bucket indices should produce different
      // jitter offsets ~99% of the time — 8/10 is a very conservative floor.
      expect(diffCount).toBeGreaterThanOrEqual(8);
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles a timestamp before the launch epoch without throwing or going negative", () => {
      const { ordersInTransit } = countersAt(LAUNCH_EPOCH_MS - DAY_MS);
      expect(ordersInTransit).toBeGreaterThanOrEqual(0);
    });

    it("ordersInTransit is positive well after launch", () => {
      const { ordersInTransit } = countersAt(LAUNCH_EPOCH_MS + 180 * DAY_MS);
      expect(ordersInTransit).toBeGreaterThan(0);
    });
  });
});
