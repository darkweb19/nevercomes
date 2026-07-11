import { describe, it, expect } from "vitest";
import {
  DEFAULT_REGION,
  resolveBrowseRegion,
  phaseForRegion,
  catalogScope,
} from "@/lib/catalog/region";

describe("resolveBrowseRegion", () => {
  it("defaults to M5V for missing input", () => {
    expect(resolveBrowseRegion(null)).toBe(DEFAULT_REGION);
    expect(resolveBrowseRegion(undefined)).toBe(DEFAULT_REGION);
    expect(resolveBrowseRegion("")).toBe(DEFAULT_REGION);
  });

  it("normalizes a valid FSA (uppercase, first 3 chars)", () => {
    expect(resolveBrowseRegion("m4y 1a1")).toBe("M4Y");
    expect(resolveBrowseRegion("M5V3A5")).toBe("M5V");
  });

  it("falls back to the default for malformed input", () => {
    expect(resolveBrowseRegion("nope")).toBe(DEFAULT_REGION);
    expect(resolveBrowseRegion("12")).toBe(DEFAULT_REGION);
    expect(resolveBrowseRegion("!!!")).toBe(DEFAULT_REGION);
  });
});

describe("phaseForRegion", () => {
  it("is cold for a missing region row", () => {
    expect(phaseForRegion(null)).toBe("cold");
  });

  it("is cold when the catalog has not been generated", () => {
    expect(phaseForRegion({ catalog_generated: false })).toBe("cold");
  });

  it("is warm once the catalog is generated", () => {
    expect(phaseForRegion({ catalog_generated: true })).toBe("warm");
  });
});

describe("catalogScope", () => {
  it("is global-only while cold, regardless of region id", () => {
    expect(catalogScope("cold", null)).toEqual({ mode: "global" });
    expect(catalogScope("cold", "abc")).toEqual({ mode: "global" });
  });

  it("scopes to the region once filling/warm with a known id", () => {
    expect(catalogScope("filling", "r1")).toEqual({
      mode: "region",
      regionId: "r1",
    });
    expect(catalogScope("warm", "r1")).toEqual({
      mode: "region",
      regionId: "r1",
    });
  });

  it("stays global when warm but the region id is unknown", () => {
    expect(catalogScope("warm", null)).toEqual({ mode: "global" });
  });
});
