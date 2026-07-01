"use client";

/**
 * Sticky paper receipt sidebar — shown on the location + payment steps.
 * Styled like the /cart receipt (fixed-LIGHT .theme-light, tear edges, ink/paper
 * ramps). Every real figure is $0.00; ghost amounts are struck through in thermal.
 * Mirrors FeeRow from /cart exactly.
 */

import { formatCents } from "@/lib/utils/money";
import type { CartLine } from "@/lib/store/cart";
import type { CartTotals } from "@/lib/cart/totals";

interface OrderSummaryProps {
  lines: CartLine[];
  totals: CartTotals;
}

export function OrderSummary({ lines, totals }: OrderSummaryProps) {
  return (
    <div className="theme-light">
      <div className="nc-tear-top" aria-hidden="true" />

      <div className="bg-paper-100 px-7 pb-7 pt-6 shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
        {/* Header */}
        <div className="mb-4 text-center">
          <div className="font-mono text-2xs font-bold uppercase tracking-label text-ink-500">
            Order summary
          </div>
        </div>

        <hr className="mb-4 border-0 border-t border-dashed border-ink-400" />

        {/* Line items */}
        <ul className="m-0 list-none p-0">
          {lines.map((line) => (
            <li
              key={line.lineId}
              className="flex items-start justify-between gap-3 border-b border-dashed border-ink-400 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-bold leading-snug text-ink-900">
                  {line.name}
                </div>
                <div className="mt-0.5 font-mono text-2xs text-ink-500">
                  qty {line.qty}
                </div>
              </div>
              <div className="flex-none text-right">
                <div className="font-mono text-sm font-bold tabular-nums text-ink-900">
                  $0.00
                </div>
                <div className="font-mono text-2xs tabular-nums text-thermal line-through">
                  {formatCents(line.priceCents * line.qty)}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Fee rows */}
        <div className="mt-4">
          <FeeRow label="Subtotal" ghost={totals.subtotalCents} strong />
          <FeeRow label="Delivery" ghost={totals.deliveryCents} />
          <FeeRow label="Service" ghost={totals.serviceCents} />
          <FeeRow label="Tax (est.)" ghost={totals.taxCents} />
        </div>

        <hr className="my-3 border-0 border-t-[1.5px] border-ink-900" />

        {/* Total */}
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display text-base font-extrabold leading-none text-ink-900">
              Total due
            </div>
            <div className="mt-1 font-mono text-2xs text-thermal">
              would&rsquo;ve been {formatCents(totals.ghostTotalCents)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xl font-bold leading-none tabular-nums text-ink-900">
              $0.00
            </div>
            <div className="mt-1 font-mono text-2xs tracking-label text-ink-400">
              CAD
            </div>
          </div>
        </div>

        {/* ETA pill */}
        <div className="mt-5 flex justify-center">
          <span className="rounded-pill border border-dashed border-ink-400 px-3 py-1 font-mono text-2xs tracking-label text-ink-500">
            ETA &middot; NEVER
          </span>
        </div>
      </div>

      <div className="nc-tear-bottom" aria-hidden="true" />
    </div>
  );
}

/** Fee line: label · ghost (struck through) · $0.00 */
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
    <div className="flex items-baseline justify-between py-1">
      <span
        className={
          strong
            ? "font-mono text-2xs font-bold uppercase tracking-wide text-ink-700"
            : "font-mono text-2xs uppercase tracking-wide text-ink-400"
        }
      >
        {label}
      </span>
      <span className="flex items-baseline gap-2.5">
        <span className="font-mono text-2xs tabular-nums text-thermal line-through">
          {formatCents(ghost)}
        </span>
        <span
          className={
            strong
              ? "font-mono text-xs font-bold tabular-nums text-ink-900"
              : "font-mono text-xs tabular-nums text-ink-500"
          }
        >
          $0.00
        </span>
      </span>
    </div>
  );
}
