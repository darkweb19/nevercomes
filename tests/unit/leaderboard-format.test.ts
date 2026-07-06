import { describe, it, expect } from "vitest";
import {
  parseLeaderboard,
  formatRank,
  formatRankLabel,
  formatWaitDays,
  formatCompactCents,
  formatInt,
} from "@/lib/viral/leaderboard";

const NOW = Date.parse("2026-07-05T12:00:00.000Z");

const ENTRY = {
  seed: "a3f09b12cd45",
  savedCents: 120450,
  orders: 38,
  oldestOrderAt: "2026-02-13T12:00:00.000Z",
  rank: 1,
};

describe("parseLeaderboard", () => {
  it("passes a well-formed payload through", () => {
    const data = parseLeaderboard({
      rows: [ENTRY],
      you: { ...ENTRY, rank: 4802 },
      totals: { neverDelivered: 128406, savedCentsAll: 218493012 },
    });
    expect(data.rows).toEqual([ENTRY]);
    expect(data.you?.rank).toBe(4802);
    expect(data.totals).toEqual({
      neverDelivered: 128406,
      savedCentsAll: 218493012,
    });
  });

  it("drops malformed rows and keeps valid ones", () => {
    const data = parseLeaderboard({
      rows: [ENTRY, { seed: 7 }, null, { ...ENTRY, savedCents: "12" }],
      you: null,
      totals: { neverDelivered: 1, savedCentsAll: 2 },
    });
    expect(data.rows).toEqual([ENTRY]);
  });

  it("null/invalid you becomes null", () => {
    expect(parseLeaderboard({ rows: [], you: null, totals: {} }).you).toBeNull();
    expect(
      parseLeaderboard({ rows: [], you: { seed: "x" }, totals: {} }).you,
    ).toBeNull();
  });

  it("defaults an unrecognizable payload to the empty board", () => {
    for (const bad of [null, undefined, 12, "x", [], {}]) {
      expect(parseLeaderboard(bad)).toEqual({
        rows: [],
        you: null,
        totals: { neverDelivered: 0, savedCentsAll: 0 },
      });
    }
  });
});

describe("formatRank / formatRankLabel", () => {
  it("zero-pads top ranks to two digits", () => {
    expect(formatRank(1)).toBe("01");
    expect(formatRank(10)).toBe("10");
    expect(formatRank(123)).toBe("123");
  });

  it("rank label groups thousands", () => {
    expect(formatRankLabel(7)).toBe("#7");
    expect(formatRankLabel(4802)).toBe("#4,802");
  });
});

describe("formatWaitDays", () => {
  it("floors whole days, mono-caps, singular at one", () => {
    expect(formatWaitDays("2026-02-13T12:00:00.000Z", NOW)).toBe("142 DAYS");
    expect(formatWaitDays("2026-07-04T12:00:00.000Z", NOW)).toBe("1 DAY");
    expect(formatWaitDays("2026-07-03T14:00:00.000Z", NOW)).toBe("1 DAY");
  });

  it("reads <1 DAY for the first day and for clock skew", () => {
    expect(formatWaitDays("2026-07-05T09:00:00.000Z", NOW)).toBe("<1 DAY");
    expect(formatWaitDays("2026-07-05T12:00:05.000Z", NOW)).toBe("<1 DAY");
  });
});

describe("formatCompactCents", () => {
  it("keeps small totals as exact currency", () => {
    expect(formatCompactCents(0)).toBe("$0.00");
    expect(formatCompactCents(120450)).toBe("$1,204.50");
  });

  it("compresses to K then M", () => {
    expect(formatCompactCents(12840612)).toBe("$128K");
    expect(formatCompactCents(218493012)).toBe("$2.2M");
  });

  it("never renders a four-digit K", () => {
    expect(formatCompactCents(99999999)).toBe("$1.0M");
  });
});

describe("formatInt", () => {
  it("groups thousands", () => {
    expect(formatInt(128406)).toBe("128,406");
    expect(formatInt(0)).toBe("0");
  });
});
