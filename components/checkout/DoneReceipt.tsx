"use client";

/**
 * Post-order paper receipt — right-column companion on the Done step.
 * Fixed-LIGHT (.theme-light), tear-edge styling, "Never arrived" stamp. Mirrors
 * the /cart receipt structure but is a static snapshot (cart already cleared).
 */

import { Stamp } from "@/components/ui/Stamp";
import { formatCents } from "@/lib/utils/money";

export interface ReceiptSnapshot {
  count: number;
  ghostTotalCents: number;
}

interface DoneReceiptProps {
  orderIdShort: string;
  receiptSnapshot: ReceiptSnapshot | null;
}

export function DoneReceipt({ orderIdShort, receiptSnapshot }: DoneReceiptProps) {
  return (
    <div className="theme-light sticky top-[88px]">
      <div className="nc-tear-top" aria-hidden="true" />

      <div className="bg-paper-100 px-7 pb-8 pt-6 shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
        {/* Receipt header */}
        <div className="mb-4 text-center">
          <div className="font-display text-base font-extrabold tracking-tight text-ink-900">
            NEVERCOMES GENERAL STORE
          </div>
          <div className="mt-1 font-mono text-2xs font-bold uppercase tracking-label text-ink-500">
            All the dopamine of buying &middot; None of the receipt
          </div>
          <div className="mt-2 font-mono text-xs tabular-nums tracking-wide text-ink-400">
            ORDER {orderIdShort}
          </div>
        </div>

        <hr className="my-4 border-0 border-t border-dashed border-ink-400" />

        {receiptSnapshot && (
          <div className="flex items-baseline justify-between py-1">
            <span className="font-mono text-2xs uppercase tracking-wide text-ink-500">
              Items
            </span>
            <span className="font-mono text-xs tabular-nums text-ink-700">
              {receiptSnapshot.count}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-wide text-ink-700">
              Total charged
            </div>
            {receiptSnapshot && (
              <div className="mt-0.5 font-mono text-2xs tabular-nums text-thermal line-through">
                {formatCents(receiptSnapshot.ghostTotalCents)}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="font-mono text-xl font-bold tabular-nums text-ink-900">
              $0.00
            </div>
            <div className="font-mono text-2xs tracking-label text-ink-400">
              CAD
            </div>
          </div>
        </div>

        <hr className="my-5 border-0 border-t border-dashed border-ink-400" />

        {/* Stamp */}
        <div className="flex justify-center">
          <Stamp label="Never arrived" />
        </div>

        <div className="mt-5 text-center">
          <span className="font-mono text-2xs font-bold uppercase tracking-label text-ink-400">
            No refund. Nothing was charged.
          </span>
        </div>
      </div>

      <div className="nc-tear-bottom" aria-hidden="true" />
    </div>
  );
}
