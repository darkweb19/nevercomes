"use client";

/**
 * The "moment it fills" confirmation. Shown briefly when a cold region's local
 * catalog lands, then it leaves quietly (the parent drops it after the dwell).
 * A quiet ink-settle, not confetti.
 */
interface StoreReadyBannerProps {
  /** Resolved FSA, e.g. "M5V". */
  region: string;
  /** Number of local items that just landed, for the deadpan sub-line. */
  itemCount: number;
}

export function StoreReadyBanner({ region, itemCount }: StoreReadyBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-4 rounded-md border border-hairline border-l-[3px] border-l-accent bg-card px-5 py-4"
      style={{ animation: "ncFadeIn 0.3s ease-out both" }}
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent text-accent-contrast">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>

      <div className="min-w-0">
        <div className="font-display text-lg font-bold leading-tight text-fg-strong">
          Your store exists now.
        </div>
        <div className="mt-0.5 font-mono text-2xs uppercase tracking-label text-fg-muted">
          {region} indexed &middot; {itemCount} local item
          {itemCount === 1 ? "" : "s"} added &middot; this banner leaves quietly
        </div>
      </div>
    </div>
  );
}
