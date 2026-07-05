import { describe, it, expect } from "vitest";
import { pseudonymFromSeed } from "@/lib/viral/pseudonym";

const SEEDS = [
  "a3f09b12cd45",
  "0000000000ff",
  "deadbeef0123",
  "5f5f5f5f5f5f",
  "c0ffee123456",
  "9a8b7c6d5e4f",
  "1234abcd5678",
  "fedcba987654",
  "0a1b2c3d4e5f",
  "ffffffffffff",
];

describe("pseudonymFromSeed", () => {
  it("is deterministic — same seed, same pseudonym", () => {
    for (const seed of SEEDS) {
      expect(pseudonymFromSeed(seed)).toEqual(pseudonymFromSeed(seed));
    }
  });

  it("renders the design's shape: 'Adjective Noun' + 4-digit code", () => {
    for (const seed of SEEDS) {
      const p = pseudonymFromSeed(seed);
      expect(p.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
      expect(p.code).toMatch(/^\d{4}$/);
      expect(p.full).toBe(`${p.name} #${p.code}`);
    }
  });

  it("spreads distinct seeds across distinct names", () => {
    const fulls = new Set(SEEDS.map((s) => pseudonymFromSeed(s).full));
    expect(fulls.size).toBeGreaterThanOrEqual(SEEDS.length - 1);
  });

  it("tolerates an empty seed without throwing", () => {
    const p = pseudonymFromSeed("");
    expect(p.full).toBe(`${p.name} #${p.code}`);
  });
});
