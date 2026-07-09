import { describe, expect, it } from "vitest";
import {
  buildSharePath,
  daysInTransit,
  parseShareParams,
  type SharePayload,
} from "@/lib/viral/share";

describe("buildSharePath / parseShareParams round-trip", () => {
  it("round-trips an order payload", () => {
    const payload: SharePayload = {
      v: "order",
      code: "NC-4B21A0",
      createdAtMs: 1_751_700_000_000,
    };
    const path = buildSharePath(payload);
    expect(path.startsWith("/w?")).toBe(true);
    const params = Object.fromEntries(new URLSearchParams(path.slice(3)));
    expect(parseShareParams(params)).toEqual(payload);
  });

  it("round-trips a me payload", () => {
    const payload: SharePayload = {
      v: "me",
      savedCents: 41_288,
      orders: 38,
      waitDays: 142,
      seed: "a3f09b12cd45",
    };
    const params = Object.fromEntries(
      new URLSearchParams(buildSharePath(payload).slice(3)),
    );
    expect(parseShareParams(params)).toEqual(payload);
  });
});

describe("parseShareParams rejects malformed input", () => {
  it("rejects unknown/missing variants", () => {
    expect(parseShareParams({})).toBeNull();
    expect(parseShareParams({ v: "rank" })).toBeNull();
    expect(parseShareParams({ v: ["order", "me"] })).toBeNull();
  });

  it("rejects bad order params", () => {
    expect(parseShareParams({ v: "order", c: "NC-4B21A0" })).toBeNull(); // no t
    expect(
      parseShareParams({ v: "order", c: "AMZN-123456", t: "1751700000000" }),
    ).toBeNull(); // wrong code shape
    expect(
      parseShareParams({ v: "order", c: "NC-4B21A0", t: "-5" }),
    ).toBeNull();
    expect(
      parseShareParams({ v: "order", c: "NC-4B21A0", t: "9999999999999999" }),
    ).toBeNull(); // past year-2100 cap
  });

  it("rejects bad me params", () => {
    const good = { v: "me", s: "41288", o: "38", w: "142", p: "a3f09b12cd45" };
    expect(parseShareParams(good)).not.toBeNull();
    expect(parseShareParams({ ...good, s: "12.50" })).toBeNull(); // not integer cents
    expect(parseShareParams({ ...good, p: "not-hex!" })).toBeNull();
    expect(parseShareParams({ ...good, o: undefined })).toBeNull();
    expect(parseShareParams({ ...good, w: "1e5" })).toBeNull();
  });
});

describe("daysInTransit", () => {
  const DAY = 86_400_000;

  it("floors to whole days", () => {
    const t0 = 1_751_700_000_000;
    expect(daysInTransit(t0, t0 + 3 * DAY + DAY / 2)).toBe(3);
    expect(daysInTransit(t0, t0 + DAY - 1)).toBe(0);
  });

  it("never goes negative on forged/future timestamps", () => {
    const t0 = 1_751_700_000_000;
    expect(daysInTransit(t0 + 10 * DAY, t0)).toBe(0);
  });
});
