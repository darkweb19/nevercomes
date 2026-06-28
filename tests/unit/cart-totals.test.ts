import { describe, it, expect } from "vitest";
import {
  computeTotals,
  DELIVERY_CENTS,
  type TotalsLine,
} from "@/lib/cart/totals";

describe("computeTotals", () => {
  it("returns all zeros for an empty cart (no delivery fee)", () => {
    expect(computeTotals([])).toEqual({
      count: 0,
      subtotalCents: 0,
      deliveryCents: 0,
      serviceCents: 0,
      taxCents: 0,
      ghostTotalCents: 0,
      realTotalCents: 0,
    });
  });

  it("charges the flat delivery fee as soon as the cart is non-empty", () => {
    const t = computeTotals([{ priceCents: 100, qty: 1 }]);
    expect(t.deliveryCents).toBe(DELIVERY_CENTS);
  });

  it("sums a single line's subtotal and count", () => {
    const t = computeTotals([{ priceCents: 250, qty: 4 }]);
    expect(t.count).toBe(4);
    expect(t.subtotalCents).toBe(1000);
  });

  it("sums subtotal + count across multiple lines", () => {
    const lines: TotalsLine[] = [
      { priceCents: 450, qty: 3 },
      { priceCents: 325, qty: 2 },
    ];
    const t = computeTotals(lines);
    expect(t.count).toBe(5);
    expect(t.subtotalCents).toBe(2000); // 1350 + 650
  });

  it("rounds service (10%) and tax (13%) to integer cents", () => {
    // subtotal 333 → service round(33.3)=33; tax on (333+499+33)=865 → round(112.45)=112
    const t = computeTotals([{ priceCents: 333, qty: 1 }]);
    expect(t.subtotalCents).toBe(333);
    expect(t.serviceCents).toBe(33);
    expect(t.taxCents).toBe(112);
    expect(Number.isInteger(t.serviceCents)).toBe(true);
    expect(Number.isInteger(t.taxCents)).toBe(true);
  });

  it("ghost total equals the sum of its parts; real total is always 0", () => {
    const t = computeTotals([{ priceCents: 1999, qty: 2 }]);
    expect(t.ghostTotalCents).toBe(
      t.subtotalCents + t.deliveryCents + t.serviceCents + t.taxCents,
    );
    expect(t.realTotalCents).toBe(0);
  });

  it("matches the design's demo cart (bagel/ramen/candle/blanket) exactly", () => {
    const lines: TotalsLine[] = [
      { priceCents: 450, qty: 3 }, // 1350
      { priceCents: 325, qty: 2 }, // 650
      { priceCents: 2800, qty: 1 }, // 2800
      { priceCents: 8900, qty: 1 }, // 8900
    ];
    const t = computeTotals(lines);
    expect(t.count).toBe(7);
    expect(t.subtotalCents).toBe(13700);
    expect(t.deliveryCents).toBe(499);
    expect(t.serviceCents).toBe(1370); // round(13700 * 0.10)
    expect(t.taxCents).toBe(2024); // round((13700+499+1370) * 0.13) = round(2023.97)
    expect(t.ghostTotalCents).toBe(17593);
    expect(t.realTotalCents).toBe(0);
  });
});
