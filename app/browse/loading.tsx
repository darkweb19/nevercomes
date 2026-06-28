/**
 * /browse loading UI — shown by Next.js App Router while the server component
 * awaits the Supabase queries. Intentionally over-dramatic about the wait.
 */
export default function BrowseLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      {/* ── Minimal header skeleton ──────────────────────────────────────── */}
      <div className="border-b border-hairline px-12 py-[18px]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4">
          {/* Logo skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-[30px] w-[30px] rounded border-2 border-hairline bg-sunken" />
            <div className="h-3 w-28 rounded-sm bg-sunken" />
          </div>
          {/* Search skeleton */}
          <div className="flex-1 max-w-[560px] h-10 rounded-md bg-sunken" />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-12 py-16">
        {/* Spinner */}
        <div
          className="mb-8 h-[34px] w-[34px] rounded-pill border-2 border-dashed border-accent"
          style={{ animation: "ncspin 2.2s linear infinite" }}
          role="status"
          aria-label="Loading store"
        />

        <h1 className="mb-3 font-display font-extrabold text-4xl text-fg-strong text-center">
          Preparing your store&hellip;
        </h1>
        <p className="mb-12 max-w-[42ch] text-center text-base text-fg-muted">
          Stocking shelves you&apos;ll never reach. Pre-warming a cart that
          resolves to $0.00.
        </p>

        {/* ── Fake progress bar ── */}
        <div className="mb-2 flex w-full max-w-[480px] items-center justify-between font-mono text-2xs uppercase tracking-label text-fg-muted">
          <span>Loading Inventory</span>
          <span>82%</span>
        </div>
        <div
          className="mb-2 h-1.5 w-full max-w-[480px] overflow-hidden rounded-pill bg-sunken"
          role="progressbar"
          aria-valuenow={82}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading progress"
        >
          <div
            className="h-full rounded-pill bg-accent"
            style={{ width: "82%" }}
          />
        </div>
        <p className="font-mono text-2xs text-fg-faint">
          Stuck at 82%. It does that.
        </p>
      </div>

      {/* ── Shimmer skeleton grid ─────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[1400px] px-12 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Single shimmer placeholder card. Mirrors CatalogCard proportions. */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-md bg-card">
      {/* Image area shimmer */}
      <div
        className="h-[152px] w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--carbon-700), var(--carbon-600), var(--carbon-700))",
          backgroundSize: "200% 100%",
          animation: "ncshimmer 1.8s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
      {/* Body skeleton lines */}
      <div className="p-4 space-y-2">
        <div className="h-2 w-16 rounded-sm bg-sunken" />
        <div className="h-4 w-full rounded-sm bg-sunken" />
        <div className="h-4 w-3/4 rounded-sm bg-sunken" />
        <div className="mt-3 h-px w-full bg-sunken" />
        <div className="flex items-baseline gap-2 pt-1">
          <div className="h-3 w-12 rounded-sm bg-sunken" />
          <div className="h-3 w-10 rounded-sm bg-sunken" />
        </div>
      </div>
    </div>
  );
}
