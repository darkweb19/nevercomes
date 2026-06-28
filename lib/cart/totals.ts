/**
 * Pure cart math — integer cents only, no floats stored (HARD RULE), no React /
 * DOM / store imports. Deterministic + unit-tested so the receipt and the drawer
 * can both derive identical figures.
 *
 * The "ghost" figures are the would-have-been amounts the receipt strikes
 * through; the real total is always 0 — the whole gag. Fee shape mirrors the
 * Claude Design (`Cart.dc.html`): flat delivery, a 10% service skim, 13% tax.
 */

/** Flat fake delivery fee (ghost), charged the moment the cart is non-empty. */
export const DELIVERY_CENTS = 499;
/** Service fee as a fraction of subtotal (ghost). */
export const SERVICE_RATE = 0.1;
/** Estimated GST/HST as a fraction of (subtotal + delivery + service) (ghost). */
export const TAX_RATE = 0.13;

/** Minimal shape `computeTotals` needs from a cart line. */
export interface TotalsLine {
  priceCents: number;
  qty: number;
}

export interface CartTotals {
  /** Total item count across all lines. */
  count: number;
  subtotalCents: number;
  deliveryCents: number;
  serviceCents: number;
  taxCents: number;
  /** Sum of the ghost figures — the "would've been" total. */
  ghostTotalCents: number;
  /** Always 0. Nothing is charged. */
  realTotalCents: number;
}

/** Round a fractional-cents product back to an integer cent value. */
function roundCents(value: number): number {
  return Math.round(value);
}

export function computeTotals(lines: TotalsLine[]): CartTotals {
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotalCents = lines.reduce((n, l) => n + l.priceCents * l.qty, 0);
  const deliveryCents = lines.length > 0 ? DELIVERY_CENTS : 0;
  const serviceCents = roundCents(subtotalCents * SERVICE_RATE);
  const taxCents = roundCents(
    (subtotalCents + deliveryCents + serviceCents) * TAX_RATE,
  );
  const ghostTotalCents =
    subtotalCents + deliveryCents + serviceCents + taxCents;

  return {
    count,
    subtotalCents,
    deliveryCents,
    serviceCents,
    taxCents,
    ghostTotalCents,
    realTotalCents: 0,
  };
}
