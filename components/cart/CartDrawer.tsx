"use client";

import { useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { useCart, LINE_SOFT_CAP } from "@/lib/store/cart";
import { computeTotals } from "@/lib/cart/totals";
import { formatCents } from "@/lib/utils/money";

/**
 * Slide-in cart drawer (dark / carbon). Presentation + behavior compose the
 * shared `Sheet` primitive, which already owns the slide, overlay, focus-trap,
 * Esc-to-close, and reduced-motion degrade — this file only renders cart content
 * and wires it to the store. Mounted once globally in app/layout.tsx so any
 * page's header can open it via `useCart().openDrawer()`.
 *
 * Everything resolves to $0.00; the struck-through "ghost" figures are the
 * would-have-been amounts (lib/cart/totals). Checkout is the Phase-4 gag — it
 * never navigates (no /checkout until Phase 5), it just spins forever.
 */
export function CartDrawer() {
  const open = useCart((s) => s.open);
  const lines = useCart((s) => s.lines);
  const capHit = useCart((s) => s.capHit);
  const promo = useCart((s) => s.promo);
  const promoApplied = useCart((s) => s.promoApplied);
  const closeDrawer = useCart((s) => s.closeDrawer);
  const setQty = useCart((s) => s.setQty);
  const removeLine = useCart((s) => s.removeLine);
  const setPromo = useCart((s) => s.setPromo);
  const applyPromo = useCart((s) => s.applyPromo);

  const [checkingOut, setCheckingOut] = useState(false);

  const totals = computeTotals(lines);
  const isEmpty = lines.length === 0;

  // TODO Phase 5: route to /checkout instead of the perpetual spinner.
  const onCheckout = () => setCheckingOut(true);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && closeDrawer()}
      side="right"
      aria-label="Your cart"
      className="flex flex-col"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-label text-fg-strong">
            Your cart
          </span>
          <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-pill bg-accent px-[7px] font-mono text-xs font-bold tabular-nums text-accent-contrast">
            {totals.count}
          </span>
        </div>
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Close cart"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-fg-strong transition-colors hover:bg-sunken"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <hr className="perforation -mx-6" />

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="-mx-6 flex-1 overflow-y-auto px-6 py-2">
        {isEmpty ? (
          <div className="px-3 py-14 text-center">
            <div className="font-display text-xl font-extrabold text-fg-strong">
              Nothing in the cart.
            </div>
            <p className="mx-auto mb-6 mt-2 max-w-[30ch] text-sm leading-relaxed text-fg-muted">
              An empty cart is the only order we can guarantee.
            </p>
            <Link
              href="/browse"
              onClick={closeDrawer}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 font-mono text-base uppercase tracking-wide text-accent-contrast transition-colors hover:bg-accent-hover"
            >
              Browse anyway
            </Link>
          </div>
        ) : (
          <ul className="m-0 list-none p-0">
            {lines.map((line) => (
              <li
                key={line.lineId}
                className="flex gap-3 border-b border-[color:var(--border-perf)] py-4"
              >
                {/* sku tile */}
                <div className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-sm border border-hairline bg-sunken">
                  <span className="font-mono text-xs font-bold tracking-wide text-fg-muted">
                    {line.sku}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0 font-display text-[15px] font-bold leading-tight text-fg-strong">
                      {line.name}
                    </div>
                    <div className="flex-none text-right">
                      <div className="font-mono text-sm font-bold tabular-nums text-fg-strong">
                        $0.00
                      </div>
                      <div className="font-mono text-[10px] tabular-nums text-fg-faint line-through">
                        {formatCents(line.priceCents * line.qty)}
                      </div>
                    </div>
                  </div>
                  {line.note && (
                    <div className="mt-1 font-mono text-[11px] text-fg-muted">
                      {line.note}
                    </div>
                  )}
                  <div className="mt-2.5 flex items-center justify-between">
                    <Stepper
                      value={line.qty}
                      min={1}
                      max={LINE_SOFT_CAP}
                      onChange={(v) => setQty(line.lineId, v)}
                      aria-label={`Quantity, ${line.name}`}
                      className="scale-90"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(line.lineId)}
                      aria-label={`Remove ${line.name}`}
                      className="flex items-center p-1.5 text-fg-faint transition-colors hover:text-accent"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}

            {capHit && (
              <div className="mt-3.5 rounded-sm border border-accent bg-accent-wash px-3 py-2.5 text-xs text-fg-strong">
                Even imaginary warehouses have limits.
              </div>
            )}
          </ul>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {!isEmpty && (
        <div className="-mx-6 -mb-6 mt-2 border-t border-hairline bg-sunken px-6 pb-6 pt-[18px]">
          <div className="mb-3.5 flex items-end gap-2">
            <Input
              placeholder="NEVERLAND"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              aria-label="Promo code"
            />
            <Button variant="secondary" size="md" onClick={applyPromo} className="flex-none">
              Apply
            </Button>
          </div>
          {promoApplied && (
            <div className="mb-3 font-mono text-[11px] text-fg-accent">
              Applied. Savings: $0.00. As designed.
            </div>
          )}

          <div className="mb-1 flex items-baseline justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-fg-muted">
              Subtotal
            </span>
            <span className="flex items-baseline gap-2.5">
              <span className="font-mono text-[11px] tabular-nums text-fg-faint line-through">
                {formatCents(totals.subtotalCents)}
              </span>
              <span className="font-mono text-lg font-bold tabular-nums text-fg-strong">
                $0.00
              </span>
            </span>
          </div>
          <p className="m-0 mb-4 font-mono text-[10px] uppercase tracking-wide text-fg-faint">
            Fees &amp; taxes calculated at the receipt. All $0.00.
          </p>

          {checkingOut && (
            <div className="mb-3 text-center font-mono text-[11px] text-fg-accent">
              Processing $0.00
              <span style={{ animation: "ncDots 1.4s infinite" }}>.</span>
              <span style={{ animation: "ncDots 1.4s 0.2s infinite" }}>.</span>
              <span style={{ animation: "ncDots 1.4s 0.4s infinite" }}>.</span>{" "}
              this may take forever.
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <Button variant="primary" size="lg" block onClick={onCheckout}>
              Checkout · $0.00
            </Button>
            <Link
              href="/cart"
              onClick={closeDrawer}
              className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-md border border-hairline bg-transparent px-3 font-mono text-sm uppercase tracking-wide text-fg-strong transition-colors hover:bg-sunken"
            >
              View full receipt
            </Link>
          </div>
        </div>
      )}
    </Sheet>
  );
}
