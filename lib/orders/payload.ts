/**
 * Pure order-payload helpers — no React / DOM / Supabase / network imports.
 * Converts checkout inputs into the shapes expected by the `create_order` RPC.
 * Unit-tested; keep all logic deterministic and side-effect-free.
 */

import { computeTotals } from "@/lib/cart/totals";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderItemInput {
  product_id: string | null;
  qty: number;
  options: Record<string, string | string[]>;
  line_total_cents: number;
}

export interface CreateOrderArgs {
  p_postal: string;
  p_region_id: string | null;
  p_dest_lat: number | null;
  p_dest_lng: number | null;
  p_fake_total_cents: number;
  p_items: OrderItemInput[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a Canadian postal code to its 3-char FSA (forward sortation area):
 * strip whitespace, uppercase, take the first 3 characters.
 *
 * @example resolvePostalPrefix("a1a 1a1") → "A1A"
 * @example resolvePostalPrefix("M5V 3A5") → "M5V"
 */
export function resolvePostalPrefix(postal: string): string {
  return postal.replace(/\s+/g, "").toUpperCase().slice(0, 3);
}

/**
 * Map cart lines to the `order_items` input shape expected by the RPC.
 * `line_total_cents` is always `priceCents * qty` (integer — no floats).
 */
export function buildOrderItems(
  lines: {
    productId: string | null;
    qty: number;
    priceCents: number;
    options: Record<string, string | string[]>;
  }[],
): OrderItemInput[] {
  return lines.map((line) => ({
    product_id: line.productId ?? null,
    qty: line.qty,
    options: line.options ?? {},
    line_total_cents: line.priceCents * line.qty,
  }));
}

/**
 * Assemble the full argument object for the `create_order` RPC.
 * The ghost total is derived from `computeTotals` — fee math is not reinvented here.
 * Region coordinates default to null on a geo miss; the order still proceeds.
 */
export function buildCreateOrderArgs(input: {
  postalCode: string;
  lines: {
    productId: string | null;
    qty: number;
    priceCents: number;
    options: Record<string, string | string[]>;
  }[];
  region: {
    id: string;
    centroid_lat: number | null;
    centroid_lng: number | null;
  } | null;
}): CreateOrderArgs {
  const { ghostTotalCents } = computeTotals(input.lines);

  return {
    p_postal: input.postalCode,
    p_region_id: input.region?.id ?? null,
    p_dest_lat: input.region?.centroid_lat ?? null,
    p_dest_lng: input.region?.centroid_lng ?? null,
    p_fake_total_cents: ghostTotalCents,
    p_items: buildOrderItems(input.lines),
  };
}
