"use client";

/**
 * The "preparing your store" receipt stub — a light thermal slip that prints
 * itself line by line while the region's local catalog is indexed. Since a cold
 * region has no vendors yet, the rows are honest redaction bars, not invented
 * names.
 *
 * Motion is CSS-keyframe-based (ncReceiptLine + ncCursorBlink) and degrades
 * automatically under the global prefers-reduced-motion rule: `both` fill-mode
 * shows every line at its resting state and the cursor stops solid. Mirrors the
 * receipt in components/checkout/ProcessingStep.tsx.
 */

interface ReceiptPrinterProps {
  /** Resolved FSA for the header line, e.g. "M5V". */
  region: string;
}

const LINE = (delay: number): React.CSSProperties => ({
  animation: `ncReceiptLine 0.35s ease-out ${delay}s both`,
});

/** Deterministic bar widths so the "redacted" rows don't reflow between paints. */
const ROW_WIDTHS = ["66%", "52%", "74%", "58%", "48%"] as const;

/** A single "redacted" vendor/item row — a faded bar plus an ink block. */
function RedactionRow({
  width,
  style,
}: {
  width: string;
  style: React.CSSProperties;
}) {
  return (
    <div style={style} className="mt-2 flex items-center gap-2">
      <span
        className="h-[9px] rounded-[1px] bg-ink-300"
        style={{ width }}
        aria-hidden="true"
      />
      <span className="h-[10px] w-3 flex-none bg-ink-400" aria-hidden="true" />
    </div>
  );
}

export function ReceiptPrinter({ region }: ReceiptPrinterProps) {
  // Delay counter — each printed line lands 0.18s after the previous. `next()`
  // is called inline in DOM order below so the stagger prints top-to-bottom.
  let step = 0;
  const next = () => LINE(0.15 + step++ * 0.18);

  return (
    <div
      className="theme-light w-full max-w-[300px]"
      style={{ "--nc-tear-bg": "var(--paper-000)" } as React.CSSProperties}
    >
      <div className="nc-tear-top" aria-hidden="true" />

      <div
        className="bg-paper-000 px-5 pb-6 pt-5 shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
        aria-hidden="true"
      >
        <div
          style={next()}
          className="font-mono text-2xs font-bold uppercase tracking-label text-ink-900"
        >
          NEVERCOMES &middot; LOCAL BUILD
        </div>
        <div style={next()} className="mt-1 font-mono text-2xs text-ink-500">
          FSA {region} &middot; PREPARING
        </div>

        <hr
          style={next()}
          className="my-3 border-0 border-t border-dashed border-ink-300"
        />

        <div
          style={next()}
          className="font-mono text-2xs font-bold text-ink-800"
        >
          &gt; indexing nearby vendors
        </div>
        <RedactionRow width={ROW_WIDTHS[0]} style={next()} />
        <RedactionRow width={ROW_WIDTHS[1]} style={next()} />
        <RedactionRow width={ROW_WIDTHS[2]} style={next()} />

        <div
          style={next()}
          className="mt-3 font-mono text-2xs font-bold text-ink-800"
        >
          &gt; region-flavoured items
        </div>
        <RedactionRow width={ROW_WIDTHS[3]} style={next()} />
        <RedactionRow width={ROW_WIDTHS[4]} style={next()} />

        <hr
          style={next()}
          className="my-3 border-0 border-t border-dashed border-ink-300"
        />

        <div
          style={next()}
          className="font-mono text-2xs font-bold text-ink-900"
        >
          STATUS: STILL PRINTING
        </div>

        {/* Live print head */}
        <div className="mt-2 flex items-center gap-1 font-mono text-xs text-ink-900">
          <span>&gt;</span>
          <span
            className="inline-block h-[13px] w-2 bg-ink-900"
            style={{ animation: "ncCursorBlink 1.1s step-start infinite" }}
          />
        </div>
      </div>

      <div className="nc-tear-bottom" aria-hidden="true" />
    </div>
  );
}
