"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/catalog/SiteHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { Stamp } from "@/components/ui/Stamp";
import { useCart, LINE_SOFT_CAP } from "@/lib/store/cart";
import { useCartReady } from "@/lib/store/useCartReady";
import { computeTotals } from "@/lib/cart/totals";
import { formatCents } from "@/lib/utils/money";

/**
 * /cart — the receipt page (Phase 4). Client-only: the cart lives in localStorage
 * and never touches the server until an order is placed (Phase 5). The order is
 * styled as a printed thermal receipt — a FIXED-LIGHT "paper" surface even though
 * the app ships dark, so the receipt subtree is wrapped in `.theme-light` and uses
 * the raw paper/ink/stamp/thermal ramps. The sticky summary aside stays dark.
 *
 * Every real figure is $0.00; the struck-through "ghost" amounts are the
 * would-have-been totals (lib/cart/totals). Checkout is the gag — it spins
 * "forever" and never navigates (no /checkout until Phase 5).
 */

const ORDER_ID = "NC-4471";

export default function CartPage() {
  const lines = useCart((s) => s.lines);
  const capHit = useCart((s) => s.capHit);
  const promo = useCart((s) => s.promo);
  const promoApplied = useCart((s) => s.promoApplied);
  const setQty = useCart((s) => s.setQty);
  const removeLine = useCart((s) => s.removeLine);
  const setPromo = useCart((s) => s.setPromo);
  const applyPromo = useCart((s) => s.applyPromo);

  const [checkingOut, setCheckingOut] = useState(false);

  // The cart lives in localStorage; until it rehydrates, render a neutral shell so
  // the first client render matches the (empty) server render. See useCartReady.
  const ready = useCartReady();
  const totals = computeTotals(lines);
  const isEmpty = lines.length === 0;

  // TODO Phase 5: route to /checkout instead of the perpetual spinner.
  const onCheckout = () => setCheckingOut(true);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-[1100px] px-7 pb-24 pt-10">
        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="mb-8">
          <Eyebrow>Your cart · NeverComes</Eyebrow>
          <h1 className="mb-1.5 mt-2.5 font-display text-4xl font-extrabold tracking-tight text-fg-strong">
            Cart
          </h1>
          <p className="m-0 max-w-[50ch] text-base text-fg-muted">
            Everything you&rsquo;ll never receive, itemized. Review it. Total it.
            Watch it resolve to nothing.
          </p>
        </div>

        {!ready ? (
          /* ── Pre-hydration shell (matches the empty server render) ────── */
          <div
            className="pt-6 text-center font-mono text-2xs uppercase tracking-label text-fg-faint"
            aria-hidden="true"
          >
            Tallying nothing&hellip;
          </div>
        ) : isEmpty ? (
          /* ── Empty state ─────────────────────────────────────────────── */
          <div className="flex justify-center pt-6">
            <div className="theme-light w-full max-w-[460px]">
              <div className="nc-tear-top" aria-hidden="true" />
              <div className="bg-paper-100 px-9 pb-9 pt-10 text-center">
                <div className="font-mono text-2xs font-bold uppercase tracking-label text-ink-500">
                  Empty cart · {ORDER_ID}
                </div>
                <div className="mb-2.5 mt-3.5 font-display text-2xl font-extrabold tracking-tight text-ink-900">
                  Nothing in the cart.
                </div>
                <p className="mx-auto mb-5 max-w-[34ch] text-base leading-relaxed text-ink-500">
                  An empty cart is the only order we can guarantee. Nothing in,
                  nothing out — as designed.
                </p>
                <div className="mb-6 flex justify-center">
                  <Stamp label="Never added" className="opacity-60" />
                </div>
                <div className="flex justify-center">
                  <Link href="/browse">
                    <Button variant="primary" size="md">
                      Browse anyway
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="nc-tear-bottom" aria-hidden="true" />
            </div>
          </div>
        ) : (
          /* ── Receipt + summary ───────────────────────────────────────── */
          <div className="flex flex-wrap items-start gap-8">
            {/* LEFT: the printed receipt (fixed light) */}
            <section className="theme-light min-w-0 flex-[3_1_520px]">
              <div className="nc-tear-top" aria-hidden="true" />

              <div className="bg-paper-100 px-9 pb-7 pt-8 text-ink-900 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {/* receipt header */}
                <div className="text-center">
                  <div className="font-display text-xl font-extrabold tracking-tight text-ink-900">
                    NEVERCOMES GENERAL STORE
                  </div>
                  <div className="mt-1.5 font-mono text-2xs font-bold uppercase tracking-label text-ink-500">
                    All the dopamine of buying · None of the receipt
                  </div>
                  <div className="mt-2.5 font-mono text-xs tabular-nums tracking-wide text-ink-400">
                    ORDER #{ORDER_ID} · CART OPEN · {totals.count} ITEMS
                  </div>
                </div>

                <hr className="my-6 border-0 border-t border-dashed border-ink-400" />

                {/* line items */}
                <ul className="m-0 list-none p-0">
                  {lines.map((line) => (
                    <li
                      key={line.lineId}
                      className="flex items-start gap-[18px] border-b border-dashed border-ink-400 py-[18px]"
                    >
                      {/* sku tile */}
                      <div className="flex h-16 w-16 flex-none items-center justify-center rounded-sm border border-paper-400 bg-paper-200">
                        <span className="font-mono text-sm font-bold tracking-wide text-ink-600">
                          {line.sku}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3.5">
                          <div className="min-w-0">
                            <div className="font-display text-md font-bold leading-tight text-ink-900">
                              {line.name}
                            </div>
                            {line.note && (
                              <div className="mt-1 font-mono text-xs tracking-wide text-ink-500">
                                {line.note}
                              </div>
                            )}
                          </div>
                          <div className="flex-none text-right">
                            <div className="font-mono text-base font-bold tabular-nums text-ink-900">
                              $0.00
                            </div>
                            <div className="mt-0.5 font-mono text-2xs tabular-nums text-thermal line-through">
                              {formatCents(line.priceCents * line.qty)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3.5 flex items-center justify-between">
                          <Stepper
                            value={line.qty}
                            min={1}
                            max={LINE_SOFT_CAP}
                            onChange={(v) => setQty(line.lineId, v)}
                            aria-label={`Quantity, ${line.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeLine(line.lineId)}
                            aria-label={`Remove ${line.name}`}
                            className="inline-flex items-center gap-1.5 px-1 py-1.5 font-mono text-2xs font-bold uppercase tracking-wider text-ink-400 transition-colors hover:text-stamp-600"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              aria-hidden="true"
                            >
                              <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* soft cap notice */}
                {capHit && (
                  <div className="mt-4 flex items-center gap-2.5 rounded-sm border border-stamp-400 bg-stamp-100 px-3.5 py-2.5">
                    <span className="font-mono text-2xs font-bold uppercase tracking-wide text-stamp-700">
                      Soft cap
                    </span>
                    <span className="text-sm text-stamp-700">
                      Even imaginary warehouses have limits.
                    </span>
                  </div>
                )}

                {/* fees */}
                <div className="mt-6">
                  <hr className="mb-4 border-0 border-t border-dashed border-ink-400" />

                  <FeeRow label="Subtotal" ghost={totals.subtotalCents} strong />
                  <FeeRow
                    label="Delivery · courier en route"
                    ghost={totals.deliveryCents}
                  />
                  <FeeRow
                    label="Service · for the simulation"
                    ghost={totals.serviceCents}
                  />
                  <FeeRow
                    label="Estimated GST / HST (13%)"
                    ghost={totals.taxCents}
                  />

                  <hr className="my-3.5 border-0 border-t-[1.5px] border-ink-900" />

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="font-display text-xl font-extrabold leading-none tracking-tight text-ink-900">
                        Total
                      </div>
                      <div className="mt-1.5 font-mono text-2xs tracking-wide text-thermal">
                        WOULD&rsquo;VE BEEN {formatCents(totals.ghostTotalCents)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-2xl font-bold leading-none tabular-nums text-ink-900">
                        $0.00
                      </div>
                      <div className="mt-1 font-mono text-2xs tracking-label text-ink-500">
                        CAD
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <span className="font-mono text-2xs font-bold uppercase tracking-label text-ink-400">
                      No refund. Nothing was charged.
                    </span>
                  </div>
                </div>
              </div>

              <div className="nc-tear-bottom" aria-hidden="true" />
            </section>

            {/* RIGHT: sticky summary / CTA (stays dark) */}
            <aside className="sticky top-[88px] max-w-[380px] flex-[1_1_320px]">
              <Card raised perforated={false}>
                <div className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
                  Order summary
                </div>

                <div className="mt-[18px] flex items-baseline justify-between">
                  <span className="font-mono text-xs uppercase tracking-wide text-fg-muted">
                    {totals.count} items
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-fg-strong">
                    $0.00
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono text-xs uppercase tracking-wide text-fg-faint">
                    Fees &amp; taxes
                  </span>
                  <span className="font-mono text-sm tabular-nums text-fg-muted">
                    $0.00
                  </span>
                </div>

                <hr className="perforation my-[18px] border-t" />

                {/* promo */}
                <div className="flex items-end gap-2">
                  <Input
                    placeholder="NEVERLAND"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    aria-label="Promo code"
                  />
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={applyPromo}
                    className="flex-none"
                  >
                    Apply
                  </Button>
                </div>
                {promoApplied && (
                  <div className="mt-2 font-mono text-2xs tracking-wide text-fg-accent">
                    Applied. Savings: $0.00. As designed.
                  </div>
                )}

                <hr className="my-4 border-0 border-t-[1.5px] border-[color:var(--border-strong)]" />

                <div className="mb-[18px] flex items-end justify-between">
                  <div>
                    <div className="font-display text-lg font-extrabold leading-none text-fg-strong">
                      Total
                    </div>
                    <div className="mt-1.5 font-mono text-2xs text-fg-faint">
                      was {formatCents(totals.ghostTotalCents)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl font-bold leading-none tabular-nums text-fg-strong">
                      $0.00
                    </div>
                    <div className="mt-1 font-mono text-2xs tracking-label text-fg-muted">
                      CAD
                    </div>
                  </div>
                </div>

                <Button variant="primary" size="lg" block onClick={onCheckout}>
                  Checkout · $0.00
                </Button>

                {checkingOut && (
                  <div className="mt-3 text-center font-mono text-2xs tracking-wide text-fg-accent">
                    Processing $0.00
                    <span style={{ animation: "ncDots 1.4s infinite" }}>.</span>
                    <span style={{ animation: "ncDots 1.4s 0.2s infinite" }}>
                      .
                    </span>
                    <span style={{ animation: "ncDots 1.4s 0.4s infinite" }}>
                      .
                    </span>{" "}
                    this may take forever.
                  </div>
                )}

                <p className="m-0 mt-3.5 text-center text-xs leading-relaxed text-fg-faint">
                  You will not be charged. You will not be delivered. The dot
                  moves; the bag does not.
                </p>
              </Card>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

/** One fee line: label · ghost amount struck through · the real $0.00. */
function FeeRow({
  label,
  ghost,
  strong = false,
}: {
  label: string;
  ghost: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span
        className={
          strong
            ? "font-mono text-xs font-bold uppercase tracking-wide text-ink-700"
            : "font-mono text-xs uppercase tracking-wide text-ink-400"
        }
      >
        {label}
      </span>
      <span className="flex items-baseline gap-3">
        <span className="font-mono text-2xs tabular-nums text-thermal line-through">
          {formatCents(ghost)}
        </span>
        <span
          className={
            strong
              ? "font-mono text-sm font-bold tabular-nums text-ink-900"
              : "font-mono text-sm tabular-nums text-ink-500"
          }
        >
          $0.00
        </span>
      </span>
    </div>
  );
}
