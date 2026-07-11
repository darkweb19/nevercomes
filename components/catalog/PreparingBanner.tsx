"use client";

import { ReceiptPrinter } from "./ReceiptPrinter";

/**
 * Cold-region banner: the global shelf is browsable, but the local layer for
 * this FSA is still being indexed. Deadpan copy + a receipt that prints itself.
 * No spinner, no progress bar, no percent — the wait is the product.
 */
interface PreparingBannerProps {
  /** Resolved FSA, e.g. "M5V". */
  region: string;
}

export function PreparingBanner({ region }: PreparingBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-8 rounded-lg border border-hairline border-l-[3px] border-l-accent bg-card p-7 shadow-[0_2px_4px_rgba(0,0,0,0.10),0_6px_16px_rgba(0,0,0,0.12)] md:flex-row md:items-stretch"
    >
      <div className="flex flex-1 flex-col justify-center gap-3.5">
        <span className="inline-flex items-center gap-2 font-mono text-2xs font-bold uppercase tracking-label text-status-transit">
          <span
            className="h-2 w-2 rounded-full bg-status-transit"
            style={{ animation: "ncPulse 2.2s ease-in-out infinite" }}
            aria-hidden="true"
          />
          Preparing &middot; {region}
        </span>

        <h2 className="max-w-[18ch] font-display text-3xl font-extrabold leading-none tracking-tight text-fg-strong">
          Preparing your store.
        </h2>

        <p className="max-w-[46ch] text-base leading-relaxed text-fg-muted">
          You&rsquo;re early. The global shelf is stocked and fully yours to
          browse. Your neighbourhood is still printing &mdash; nearby vendors and
          local items will slot in on top. The wait is the product.
        </p>

        <p className="font-mono text-2xs uppercase leading-relaxed tracking-label text-fg-faint">
          No spinner. No progress bar. No percent.
          <br />
          This store is honest about nothing &mdash; including load time.
        </p>
      </div>

      <div className="flex flex-none justify-center md:justify-end">
        <ReceiptPrinter region={region} />
      </div>
    </div>
  );
}
