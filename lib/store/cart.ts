import { create } from "zustand";

// ⚠️ MINIMAL Phase-3 cart store. Phase 4 EXTENDS this (do not rewrite):
// localStorage persistence, quantities/merging, fake fees, a fake promo code,
// and the running total all land in Phase 4. For Phase 3 the only requirement
// (DoD) is that add-to-cart updates the store and the header count reflects it.

export interface CartLine {
  productId: string;
  qty: number;
  /** Selected option choices, keyed by group name (e.g. { Size: "M" }). */
  options: Record<string, string | string[]>;
}

interface CartState {
  lines: CartLine[];
  /** Append a line (no merging yet — Phase 4). */
  addLine: (line: CartLine) => void;
  /** Total item count across all lines — drives the header badge. */
  count: () => number;
  clear: () => void;
}

export const useCart = create<CartState>((set, get) => ({
  lines: [],
  addLine: (line) => set((s) => ({ lines: [...s.lines, line] })),
  count: () => get().lines.reduce((n, l) => n + l.qty, 0),
  clear: () => set({ lines: [] }),
}));
