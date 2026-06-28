"use client";

import { useSyncExternalStore } from "react";
import { useCart } from "@/lib/store/cart";

/**
 * True once the persisted cart has rehydrated from localStorage on the client.
 *
 * The store rehydrates synchronously at module load in the browser, so the first
 * client render already holds the persisted lines — but the server rendered with
 * an empty cart. Reading cart data during render therefore risks a React hydration
 * mismatch (header flashing `CART · 0`, /cart flashing its empty state).
 *
 * `useSyncExternalStore` solves this cleanly: it uses the server snapshot (`false`)
 * for SSR and the initial hydration render — matching the server HTML — then swaps
 * to the client snapshot, so cart-dependent UI reveals only after mount.
 */
export function useCartReady(): boolean {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
