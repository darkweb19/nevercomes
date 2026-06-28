/**
 * Format integer cents as a localized currency string. Money is always stored
 * and passed as integer cents (HARD RULE: no floats); this is the only place
 * that divides by 100 for display.
 *
 * Note: on-screen catalog prices are the `$0.00` gag, but the struck-through
 * "was" price uses real `price_cents` — hence a real formatter.
 */
export function formatCents(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
