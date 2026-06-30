import { describe, it, expect } from "vitest";
import {
  resolvePostalPrefix,
  buildOrderItems,
  buildCreateOrderArgs,
} from "@/lib/orders/payload";
import { computeTotals } from "@/lib/cart/totals";

// ---------------------------------------------------------------------------
// resolvePostalPrefix
// ---------------------------------------------------------------------------

describe("resolvePostalPrefix", () => {
  it("normalizes a lowercase postal code with a space to 3-char FSA", () => {
    expect(resolvePostalPrefix("a1a 1a1")).toBe("A1A");
  });

  it("handles a postal code that is already clean and uppercase", () => {
    expect(resolvePostalPrefix("M5V3A5")).toBe("M5V");
  });

  it("uppercases a lowercase FSA with no space", () => {
    expect(resolvePostalPrefix("k1a0a9")).toBe("K1A");
  });

  it("strips all internal whitespace before slicing", () => {
    expect(resolvePostalPrefix(" T2P  4B9")).toBe("T2P");
  });

  it("returns only the first 3 chars even when input is already an FSA", () => {
    expect(resolvePostalPrefix("V6B")).toBe("V6B");
  });
});

// ---------------------------------------------------------------------------
// buildOrderItems
// ---------------------------------------------------------------------------

describe("buildOrderItems", () => {
  it("maps a single line with a product ID correctly", () => {
    const result = buildOrderItems([
      {
        productId: "prod-1",
        qty: 2,
        priceCents: 499,
        options: { Size: "M" },
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      product_id: "prod-1",
      qty: 2,
      options: { Size: "M" },
      line_total_cents: 998, // 499 * 2
    });
  });

  it("computes line_total_cents as priceCents * qty (integer result)", () => {
    const [item] = buildOrderItems([
      { productId: "x", qty: 3, priceCents: 1050, options: {} },
    ]);
    expect(item.line_total_cents).toBe(3150);
    expect(Number.isInteger(item.line_total_cents)).toBe(true);
  });

  it("passes through a null productId without coercing", () => {
    const [item] = buildOrderItems([
      { productId: null, qty: 1, priceCents: 200, options: {} },
    ]);
    expect(item.product_id).toBeNull();
  });

  it("defaults options to {} when the input options object is falsy-ish (empty)", () => {
    const [item] = buildOrderItems([
      { productId: "p", qty: 1, priceCents: 100, options: {} },
    ]);
    expect(item.options).toEqual({});
  });

  it("preserves multi-value options (string arrays)", () => {
    const [item] = buildOrderItems([
      {
        productId: "p",
        qty: 1,
        priceCents: 100,
        options: { Toppings: ["olives", "mushrooms"] },
      },
    ]);
    expect(item.options).toEqual({ Toppings: ["olives", "mushrooms"] });
  });

  it("returns an empty array for an empty lines array", () => {
    expect(buildOrderItems([])).toEqual([]);
  });

  it("handles multiple lines", () => {
    const result = buildOrderItems([
      { productId: "a", qty: 1, priceCents: 500, options: {} },
      { productId: "b", qty: 3, priceCents: 200, options: { Size: "L" } },
    ]);
    expect(result).toHaveLength(2);
    expect(result[1].line_total_cents).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// buildCreateOrderArgs
// ---------------------------------------------------------------------------

/** Reusable typed lines fixture for buildCreateOrderArgs tests. */
type LineInput = {
  productId: string | null;
  qty: number;
  priceCents: number;
  options: Record<string, string | string[]>;
};

describe("buildCreateOrderArgs", () => {
  const lines: LineInput[] = [
    { productId: "prod-a", qty: 2, priceCents: 1000, options: {} },
    { productId: "prod-b", qty: 1, priceCents: 500, options: { Color: "red" } },
  ];

  const region = {
    id: "region-uuid",
    centroid_lat: 45.4215,
    centroid_lng: -75.6972,
  };

  it("sets p_postal to the raw postalCode (not the FSA)", () => {
    const args = buildCreateOrderArgs({ postalCode: "K1A 0A9", lines, region });
    expect(args.p_postal).toBe("K1A 0A9");
  });

  it("derives p_fake_total_cents from computeTotals (ghost total)", () => {
    const args = buildCreateOrderArgs({ postalCode: "K1A", lines, region });
    const expected = computeTotals(lines).ghostTotalCents;
    expect(args.p_fake_total_cents).toBe(expected);
    expect(Number.isInteger(args.p_fake_total_cents)).toBe(true);
  });

  it("populates region fields when a region is provided", () => {
    const args = buildCreateOrderArgs({ postalCode: "K1A", lines, region });
    expect(args.p_region_id).toBe("region-uuid");
    expect(args.p_dest_lat).toBe(45.4215);
    expect(args.p_dest_lng).toBe(-75.6972);
  });

  it("sets region/dest fields to null when region is null (geo miss)", () => {
    const args = buildCreateOrderArgs({
      postalCode: "X9X 9X9",
      lines,
      region: null,
    });
    expect(args.p_region_id).toBeNull();
    expect(args.p_dest_lat).toBeNull();
    expect(args.p_dest_lng).toBeNull();
  });

  it("sets dest to null when region centroid coordinates are null", () => {
    const regionNoCentroid = {
      id: "region-uuid",
      centroid_lat: null,
      centroid_lng: null,
    };
    const args = buildCreateOrderArgs({
      postalCode: "M5V",
      lines,
      region: regionNoCentroid,
    });
    expect(args.p_region_id).toBe("region-uuid");
    expect(args.p_dest_lat).toBeNull();
    expect(args.p_dest_lng).toBeNull();
  });

  it("builds p_items via buildOrderItems (correct length and totals)", () => {
    const args = buildCreateOrderArgs({ postalCode: "K1A", lines, region });
    expect(args.p_items).toHaveLength(2);
    expect(args.p_items[0].line_total_cents).toBe(2000); // 1000 * 2
    expect(args.p_items[1].line_total_cents).toBe(500);  // 500 * 1
  });

  it("computes ghost total of zero for an empty lines array", () => {
    const args = buildCreateOrderArgs({
      postalCode: "V6B",
      lines: [],
      region: null,
    });
    expect(args.p_fake_total_cents).toBe(0);
    expect(args.p_items).toEqual([]);
  });
});
