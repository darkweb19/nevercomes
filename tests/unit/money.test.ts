import { describe, it, expect } from "vitest";
import { formatCents } from "@/lib/utils/money";

describe("formatCents", () => {
  it("formats zero as $0.00 (the product gag)", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats cents to dollars with two decimals", () => {
    expect(formatCents(599)).toBe("$5.99");
    expect(formatCents(1299)).toBe("$12.99");
    expect(formatCents(19999)).toBe("$199.99");
  });

  it("pads sub-dollar and sub-dime amounts", () => {
    expect(formatCents(5)).toBe("$0.05");
    expect(formatCents(50)).toBe("$0.50");
  });

  it("groups thousands", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
  });
});
