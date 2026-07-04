import { describe, it, expect } from "vitest";
import { computeStats, deriveMilestones, type MeStats } from "@/lib/me/stats";

const DAY_MS = 86_400_000;

const T0 = Date.parse("2026-07-04T12:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();

function order(fakeTotalCents: number, createdAtMs = T0 - DAY_MS) {
  return { fakeTotalCents, createdAt: iso(createdAtMs) };
}

describe("computeStats", () => {
  it("sums ghost totals in integer cents", () => {
    const stats = computeStats(
      [order(1680), order(14230), order(2850)],
      iso(T0 - 3 * DAY_MS),
      T0,
    );
    expect(stats.moneySavedCents).toBe(1680 + 14230 + 2850);
    expect(stats.ordersPlaced).toBe(3);
  });

  it("is all zeros (except streak) for a fresh profile with no orders", () => {
    const stats = computeStats([], iso(T0), T0);
    expect(stats.moneySavedCents).toBe(0);
    expect(stats.ordersPlaced).toBe(0);
    expect(stats.streakDays).toBe(1);
  });

  it("NEVER reports a delivered order, for any input (the product)", () => {
    const cases: MeStats[] = [
      computeStats([], iso(T0), T0),
      computeStats([order(1)], iso(T0 - DAY_MS), T0),
      computeStats(
        Array.from({ length: 500 }, (_, i) => order(999, T0 - i * DAY_MS)),
        iso(T0 - 500 * DAY_MS),
        T0,
      ),
    ];
    for (const stats of cases) {
      expect(stats.ordersDelivered).toBe(0);
    }
  });

  it("streak = full days since the profile existed, plus today", () => {
    expect(computeStats([], iso(T0 - 47 * DAY_MS), T0).streakDays).toBe(48);
    expect(computeStats([], iso(T0 - 47 * DAY_MS - 3600_000), T0).streakDays).toBe(48);
    expect(computeStats([], iso(T0 - 1), T0).streakDays).toBe(1);
  });

  it("clamps a future profileCreatedAt (clock skew) to a 1-day streak", () => {
    expect(computeStats([], iso(T0 + DAY_MS), T0).streakDays).toBe(1);
  });

  it("is deterministic: same inputs, identical output", () => {
    const orders = [order(1680), order(14230)];
    const a = computeStats(orders, iso(T0 - 9 * DAY_MS), T0);
    const b = computeStats(orders, iso(T0 - 9 * DAY_MS), T0);
    expect(a).toEqual(b);
  });
});

describe("deriveMilestones", () => {
  const base: MeStats = {
    moneySavedCents: 0,
    ordersPlaced: 0,
    ordersDelivered: 0,
    streakDays: 1,
  };

  it("is empty for a fresh account with no orders", () => {
    expect(deriveMilestones(base)).toEqual([]);
    expect(deriveMilestones({ ...base, streakDays: 400 })).toEqual([]);
  });

  it("starts with the deadpan baseline after the first order", () => {
    expect(
      deriveMilestones({ ...base, ordersPlaced: 1, moneySavedCents: 1680 }),
    ).toEqual(["Zero deliveries, zero regrets"]);
  });

  it("unlocks the full set in a stable order (the design's rich state)", () => {
    expect(
      deriveMilestones({
        moneySavedCents: 39065,
        ordersPlaced: 6,
        ordersDelivered: 0,
        streakDays: 47,
      }),
    ).toEqual([
      "47-day streak",
      "Six for six never arrived",
      "Repeat non-customer",
      "Zero deliveries, zero regrets",
      "$100+ never charged",
    ]);
  });

  it("keeps the never-arrived ratio for large counts in digits", () => {
    const milestones = deriveMilestones({
      moneySavedCents: 100,
      ordersPlaced: 13,
      ordersDelivered: 0,
      streakDays: 2,
    });
    expect(milestones).toContain("13 for 13 never arrived");
  });

  it("holds thresholds: no streak badge under 7 days, no ratio under 3 orders", () => {
    const milestones = deriveMilestones({
      moneySavedCents: 500,
      ordersPlaced: 2,
      ordersDelivered: 0,
      streakDays: 6,
    });
    expect(milestones).toEqual(["Repeat non-customer", "Zero deliveries, zero regrets"]);
  });
});
