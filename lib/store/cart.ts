import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Phase-4 cart store. Client-only: persisted to localStorage, never touches the
// server until an order is placed. Money is integer cents (snapshotted onto the
// line at add-time so the cart renders without re-fetching). Fee/total math
// lives in the pure `lib/cart/totals` module — this store only holds state.

/** Soft per-line quantity cap. Deadpan, not a hard error (spec §9). */
export const LINE_SOFT_CAP = 24;

export interface CartLine {
  /** Stable identity = productId + a deterministic options signature. */
  lineId: string;
  productId: string;
  qty: number;
  /** Snapshot of `price_cents` at add-time (never the $0.00 gag). */
  priceCents: number;
  /** Snapshot of the product name for receipt rendering. */
  name: string;
  /** Short descriptor (vendor / option summary). */
  note?: string;
  /** Derived short code shown on the receipt tile. */
  sku: string;
  /** Selected option choices, keyed by group name (e.g. { Size: "M" }). */
  options: Record<string, string | string[]>;
}

/** What a caller passes to `addLine`; the store derives `lineId` + `sku`. */
export type AddLineInput = Omit<CartLine, "lineId" | "sku">;

interface CartState {
  lines: CartLine[];
  /** The line currently pinned at the soft cap (for the deadpan notice). */
  capHit: string | null;
  promo: string;
  promoApplied: boolean;
  /** Drawer open state — UI only, never persisted. */
  open: boolean;

  addLine: (line: AddLineInput) => void;
  setQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;

  setPromo: (code: string) => void;
  applyPromo: () => void;

  openDrawer: () => void;
  closeDrawer: () => void;

  /** Total item count across all lines — drives the header badge. */
  count: () => number;
}

/** Deterministic signature of an options selection (order-independent). */
function optionsSignature(options: Record<string, string | string[]>): string {
  return Object.keys(options)
    .sort()
    .map((k) => {
      const v = options[k];
      const val = Array.isArray(v) ? [...v].sort().join(",") : v;
      return `${k}=${val}`;
    })
    .join("|");
}

function makeLineId(
  productId: string,
  options: Record<string, string | string[]>,
): string {
  const sig = optionsSignature(options);
  return sig ? `${productId}#${sig}` : productId;
}

/** First three alpha chars of the name, uppercased; "ITM" if none. */
function deriveSku(name: string): string {
  const alpha = (name.match(/[a-zA-Z]/g) ?? []).slice(0, 3).join("");
  return alpha ? alpha.toUpperCase() : "ITM";
}

function clampQty(qty: number): number {
  return Math.min(Math.max(qty, 0), LINE_SOFT_CAP);
}

// localStorage isn't present during SSR or in the node test runner; fall back to
// an in-memory shim so `persist` neither throws nor warns.
const memoryStorage = (() => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
})();

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      capHit: null,
      promo: "",
      promoApplied: false,
      open: false,

      addLine: (input) =>
        set((s) => {
          const lineId = makeLineId(input.productId, input.options);
          const existing = s.lines.find((l) => l.lineId === lineId);
          if (existing) {
            const merged = clampQty(existing.qty + input.qty);
            return {
              lines: s.lines.map((l) =>
                l.lineId === lineId ? { ...l, qty: merged } : l,
              ),
              capHit: merged >= LINE_SOFT_CAP ? lineId : s.capHit,
            };
          }
          const qty = clampQty(input.qty);
          const line: CartLine = {
            ...input,
            qty,
            lineId,
            sku: deriveSku(input.name),
          };
          return {
            lines: [...s.lines, line],
            capHit: qty >= LINE_SOFT_CAP ? lineId : s.capHit,
          };
        }),

      setQty: (lineId, qty) =>
        set((s) => {
          if (qty <= 0) {
            return {
              lines: s.lines.filter((l) => l.lineId !== lineId),
              capHit: s.capHit === lineId ? null : s.capHit,
            };
          }
          const clamped = clampQty(qty);
          const atCap = clamped >= LINE_SOFT_CAP;
          return {
            lines: s.lines.map((l) =>
              l.lineId === lineId ? { ...l, qty: clamped } : l,
            ),
            capHit: atCap ? lineId : s.capHit === lineId ? null : s.capHit,
          };
        }),

      removeLine: (lineId) =>
        set((s) => ({
          lines: s.lines.filter((l) => l.lineId !== lineId),
          capHit: s.capHit === lineId ? null : s.capHit,
        })),

      clear: () => set({ lines: [], capHit: null }),

      setPromo: (code) => set({ promo: code }),
      applyPromo: () =>
        set((s) => (s.promo.trim() ? { promoApplied: true } : s)),

      openDrawer: () => set({ open: true }),
      closeDrawer: () => set({ open: false }),

      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
    }),
    {
      name: "nc-cart",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : memoryStorage,
      ),
      // Persist only data — not drawer UI state, not the action functions.
      partialize: (s) => ({
        lines: s.lines,
        promo: s.promo,
        promoApplied: s.promoApplied,
      }),
    },
  ),
);
