import { describe, it, expect, beforeEach } from "vitest";
import { useCart, LINE_SOFT_CAP, type AddLineInput } from "@/lib/store/cart";

function line(over: Partial<AddLineInput> = {}): AddLineInput {
  return {
    productId: "p1",
    qty: 1,
    priceCents: 500,
    name: "The Last Bagel",
    note: "Everything · toasted",
    options: {},
    ...over,
  };
}

beforeEach(() => {
  // Reset to a clean store between tests (the persisted instance is a singleton).
  useCart.setState({ lines: [], capHit: null, promo: "", promoApplied: false, open: false });
});

describe("cart store", () => {
  it("adds a new line, deriving lineId + sku", () => {
    useCart.getState().addLine(line());
    const lines = useCart.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0].lineId).toBe("p1");
    expect(lines[0].sku).toBe("THE"); // first 3 alpha of "The Last Bagel"
    expect(lines[0].priceCents).toBe(500);
  });

  it("merges into the same line when productId + options match", () => {
    useCart.getState().addLine(line({ qty: 2 }));
    useCart.getState().addLine(line({ qty: 3 }));
    const lines = useCart.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(5);
  });

  it("treats different options as distinct lines", () => {
    useCart.getState().addLine(line({ options: { Size: "M" } }));
    useCart.getState().addLine(line({ options: { Size: "L" } }));
    expect(useCart.getState().lines).toHaveLength(2);
  });

  it("derives an order-independent lineId from options", () => {
    useCart.getState().addLine(line({ options: { Size: "M", Heat: "Hot" } }));
    useCart.getState().addLine(line({ options: { Heat: "Hot", Size: "M" } }));
    expect(useCart.getState().lines).toHaveLength(1);
  });

  it("clamps qty to the soft cap and records capHit", () => {
    useCart.getState().addLine(line());
    useCart.getState().setQty("p1", LINE_SOFT_CAP + 10);
    const s = useCart.getState();
    expect(s.lines[0].qty).toBe(LINE_SOFT_CAP);
    expect(s.capHit).toBe("p1");
  });

  it("clears capHit when qty drops back below the cap", () => {
    useCart.getState().addLine(line());
    useCart.getState().setQty("p1", LINE_SOFT_CAP + 1);
    expect(useCart.getState().capHit).toBe("p1");
    useCart.getState().setQty("p1", 2);
    expect(useCart.getState().capHit).toBeNull();
  });

  it("removes a line when setQty drops to 0 or below", () => {
    useCart.getState().addLine(line());
    useCart.getState().setQty("p1", 0);
    expect(useCart.getState().lines).toHaveLength(0);
  });

  it("removeLine drops the line and clears its capHit", () => {
    useCart.getState().addLine(line({ qty: LINE_SOFT_CAP }));
    expect(useCart.getState().capHit).toBe("p1");
    useCart.getState().removeLine("p1");
    expect(useCart.getState().lines).toHaveLength(0);
    expect(useCart.getState().capHit).toBeNull();
  });

  it("clear() empties lines and capHit", () => {
    useCart.getState().addLine(line({ qty: LINE_SOFT_CAP }));
    useCart.getState().clear();
    expect(useCart.getState().lines).toHaveLength(0);
    expect(useCart.getState().capHit).toBeNull();
  });

  it("applyPromo only marks applied when the code is non-empty", () => {
    useCart.getState().applyPromo();
    expect(useCart.getState().promoApplied).toBe(false);
    useCart.getState().setPromo("  ");
    useCart.getState().applyPromo();
    expect(useCart.getState().promoApplied).toBe(false);
    useCart.getState().setPromo("NEVERLAND");
    useCart.getState().applyPromo();
    expect(useCart.getState().promoApplied).toBe(true);
  });

  it("count() sums qty across all lines", () => {
    useCart.getState().addLine(line({ productId: "a", qty: 2 }));
    useCart.getState().addLine(line({ productId: "b", qty: 3 }));
    expect(useCart.getState().count()).toBe(5);
  });
});
