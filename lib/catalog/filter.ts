// Pure catalog filter/sort helpers — no React, DOM, or Supabase imports.
// Unit-tested (tests/unit/filter.test.ts) per rules/testing.md.

export type CatalogSort = "anticipation" | "rating" | "price";

/** Sentinel for the "All" category chip (no category filter). */
export const CATEGORY_ALL = "all";

export const SORTS: { key: CatalogSort; label: string }[] = [
  { key: "anticipation", label: "Anticipation" },
  { key: "rating", label: "Rating" },
  { key: "price", label: "Price" },
];

/** Coerce arbitrary input to a known sort key, defaulting to "anticipation". */
export function parseSort(raw: string | null | undefined): CatalogSort {
  return SORTS.some((s) => s.key === raw)
    ? (raw as CatalogSort)
    : "anticipation";
}

/**
 * Strip characters that carry meaning in a PostgREST filter string (commas,
 * parens, dots, wildcards, colons, backslashes) before interpolating user
 * search input into an `.or(...ilike...)` query, then collapse whitespace.
 * Returns "" when there is nothing to filter on.
 */
export function sanitizeSearch(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/[,()*%:.\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether more catalog rows remain to load (drives infinite scroll). */
export function hasMore(loaded: number, total: number): boolean {
  return loaded < total;
}
