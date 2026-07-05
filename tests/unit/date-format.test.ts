import { describe, it, expect } from "vitest";
import { formatShortDate } from "@/lib/utils/date";

const NOW = Date.parse("2026-07-04T12:00:00.000Z");

describe("formatShortDate", () => {
  it("reads JUST NOW inside the first ten minutes", () => {
    expect(formatShortDate("2026-07-04T12:00:00.000Z", NOW)).toBe("JUST NOW");
    expect(formatShortDate("2026-07-04T11:55:00.000Z", NOW)).toBe("JUST NOW");
    expect(formatShortDate("2026-07-04T11:50:00.001Z", NOW)).toBe("JUST NOW");
  });

  it("switches to the mono date at exactly ten minutes", () => {
    expect(formatShortDate("2026-07-04T11:50:00.000Z", NOW)).toBe("JUL 04");
  });

  it("renders the design's MON DD shape, zero-padded", () => {
    expect(formatShortDate("2026-05-18T09:30:00.000Z", NOW)).toBe("MAY 18");
    expect(formatShortDate("2026-04-02T23:59:59.000Z", NOW)).toBe("APR 02");
    expect(formatShortDate("2026-02-24T00:00:00.000Z", NOW)).toBe("FEB 24");
  });

  it("uses the UTC calendar date (no server-timezone drift)", () => {
    expect(formatShortDate("2026-03-11T23:30:00.000Z", NOW)).toBe("MAR 11");
    expect(formatShortDate("2026-03-12T00:30:00.000Z", NOW)).toBe("MAR 12");
  });

  it("treats a slightly-future timestamp (clock skew) as JUST NOW", () => {
    expect(formatShortDate("2026-07-04T12:00:05.000Z", NOW)).toBe("JUST NOW");
  });
});
