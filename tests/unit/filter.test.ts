import { describe, it, expect } from "vitest";
import {
  parseSort,
  sanitizeSearch,
  hasMore,
} from "@/lib/catalog/filter";

describe("parseSort", () => {
  it("returns a known sort key unchanged", () => {
    expect(parseSort("rating")).toBe("rating");
    expect(parseSort("price")).toBe("price");
    expect(parseSort("anticipation")).toBe("anticipation");
  });

  it("falls back to anticipation for unknown/empty input", () => {
    expect(parseSort(null)).toBe("anticipation");
    expect(parseSort(undefined)).toBe("anticipation");
    expect(parseSort("bogus")).toBe("anticipation");
  });
});

describe("sanitizeSearch", () => {
  it("trims and collapses whitespace", () => {
    expect(sanitizeSearch("  ramen   bowl ")).toBe("ramen bowl");
  });

  it("strips PostgREST filter metacharacters", () => {
    expect(sanitizeSearch("burger, fries")).toBe("burger fries");
    expect(sanitizeSearch("noodle(s)")).toBe("noodle s");
    expect(sanitizeSearch("50% off*")).toBe("50 off");
  });

  it("returns empty string for nullish/blank input", () => {
    expect(sanitizeSearch(null)).toBe("");
    expect(sanitizeSearch(undefined)).toBe("");
    expect(sanitizeSearch("   ")).toBe("");
  });
});

describe("hasMore", () => {
  it("is true while fewer rows are loaded than the total", () => {
    expect(hasMore(12, 30)).toBe(true);
    expect(hasMore(0, 1)).toBe(true);
  });

  it("is false once all rows are loaded", () => {
    expect(hasMore(30, 30)).toBe(false);
    expect(hasMore(31, 30)).toBe(false);
    expect(hasMore(0, 0)).toBe(false);
  });
});
