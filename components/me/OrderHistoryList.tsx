import { Fragment } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Perforation } from "@/components/ui/Perforation";
import { formatCents } from "@/lib/utils/money";
import { formatShortDate } from "@/lib/utils/date";

export interface OrderRow {
  id: string;
  vendorName: string | null;
  itemSummary: string;
  ghostTotalCents: number;
  createdAtIso: string;
  isNever: boolean;
}

interface OrderHistoryListProps {
  rows: OrderRow[];
  now: number;
}

/**
 * Order history list — server-safe, no "use client".
 *
 * Each row links to /track/[id]. Desktop uses a 5-col grid; mobile stacks
 * the content with vendor+pill on one line, items below, total+date at the bottom.
 * Perforation appears between rows (not after the last).
 */
export function OrderHistoryList({ rows, now }: OrderHistoryListProps) {
  return (
    <Card padded={false}>
      {rows.map((row, i) => {
        const vendor = row.vendorName ?? "Somewhere local";
        const date = formatShortDate(row.createdAtIso, now);
        const total = formatCents(row.ghostTotalCents);
        const pillVariant = row.isNever ? "never" : "transit";

        return (
          <Fragment key={row.id}>
            {i > 0 && <Perforation className="mx-6" />}

            <Link
              href={`/track/${row.id}`}
              className={[
                // Mobile (default): stacked column layout
                "flex flex-col gap-1.5 px-[18px] py-4",
                "text-inherit no-underline",
                "hover:bg-sunken",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
                // Desktop sm+: 5-col grid
                "sm:grid sm:grid-cols-[1fr_130px_100px_170px_20px]",
                "sm:items-center sm:gap-4 sm:px-6 sm:py-5",
              ].join(" ")}
            >
              {/* Col 1: vendor + items ──────────────────────────────────── */}
              <div className="min-w-0">
                {/* Mobile: vendor name + status pill on the same line */}
                <div className="flex items-center justify-between gap-2 sm:hidden">
                  <span className="font-display text-[15px] font-bold text-fg-strong truncate">
                    {vendor}
                  </span>
                  <StatusPill variant={pillVariant} pulse={false} />
                </div>

                {/* Desktop: vendor name only */}
                <div className="hidden font-display text-md font-bold text-fg-strong sm:block truncate">
                  {vendor}
                </div>

                {/* Items line — both viewports */}
                <div className="mt-0.5 text-[13px] text-fg-muted sm:mt-[3px] truncate">
                  {row.itemSummary}
                </div>
              </div>

              {/* Col 2: struck total (desktop only) ────────────────────── */}
              <div className="hidden font-mono text-[13px] text-fg-faint line-through sm:block sm:text-right">
                {total}
              </div>

              {/* Col 3: date (desktop only) ─────────────────────────────── */}
              <div className="hidden font-mono text-xs tracking-wide text-fg-muted sm:block">
                {date}
              </div>

              {/* Col 4: status pill (desktop only) ──────────────────────── */}
              <div className="hidden sm:block">
                <StatusPill variant={pillVariant} pulse={false} />
              </div>

              {/* Col 5: chevron (desktop only) ──────────────────────────── */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="hidden text-fg-faint sm:block"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>

              {/* Mobile bottom row: struck total + date ──────────────────── */}
              <div className="flex items-center justify-between sm:hidden">
                <span className="font-mono text-xs text-fg-faint line-through">
                  {total}
                </span>
                <span className="font-mono text-[11px] text-fg-muted">
                  {date}
                </span>
              </div>
            </Link>
          </Fragment>
        );
      })}
    </Card>
  );
}
