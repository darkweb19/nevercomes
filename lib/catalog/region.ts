// Pure region-scoping helpers for /browse — no React, DOM, or Supabase imports.
// Unit-tested (tests/unit/region.test.ts) per rules/testing.md.
//
// The catalog is generated per postal region (FSA) by the offline worker. A
// visitor whose region hasn't been generated yet is "cold": they see the global
// floor (region_id IS NULL) while their local layer is prepared. Once the
// region's catalog is generated they are "warm" (local + global mixed).
// "filling" is a client-only transient — the moment the local layer lands.

import { resolvePostalPrefix } from "@/lib/orders/payload";

/** The region every visitor defaults to (pre-seed is GTA-only). */
export const DEFAULT_REGION = "M5V";

/** Canadian forward sortation area: letter-digit-letter, e.g. "M5V". */
const FSA_RE = /^[A-Z]\d[A-Z]$/;

/**
 * Resolve the browse region from an optional `?region=` param, falling back to
 * DEFAULT_REGION for a missing or malformed value.
 *
 * @example resolveBrowseRegion(null)      → "M5V"
 * @example resolveBrowseRegion("m4y 1a1") → "M4Y"
 * @example resolveBrowseRegion("nope")    → "M5V"
 */
export function resolveBrowseRegion(param: string | null | undefined): string {
  if (!param) return DEFAULT_REGION;
  const fsa = resolvePostalPrefix(param);
  return FSA_RE.test(fsa) ? fsa : DEFAULT_REGION;
}

/** cold = global floor only + "preparing" UI; warm = local + global mixed. */
export type BrowsePhase = "cold" | "filling" | "warm";

/**
 * Steady-state phase implied by a region row. A missing row or an ungenerated
 * catalog is "cold"; a generated catalog is "warm". ("filling" is never derived
 * here — it's the client's transient between the two.)
 */
export function phaseForRegion(
  row: { catalog_generated: boolean } | null,
): "cold" | "warm" {
  return row?.catalog_generated ? "warm" : "cold";
}

/**
 * Which products the catalog query should return, given the phase + resolved
 * region id. Cold (or an unknown region) sees only the global floor; a warm or
 * filling region also sees its local rows.
 */
export type CatalogRegionScope =
  | { mode: "global" }
  | { mode: "region"; regionId: string };

export function catalogScope(
  phase: BrowsePhase,
  regionId: string | null,
): CatalogRegionScope {
  if (phase !== "cold" && regionId) return { mode: "region", regionId };
  return { mode: "global" };
}
