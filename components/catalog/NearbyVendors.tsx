"use client";

import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { RegionVendor } from "@/lib/supabase/queries";
import type { BrowsePhase } from "@/lib/catalog/region";

interface NearbyVendorsProps {
  phase: BrowsePhase;
  /** Resolved FSA, e.g. "M5V". */
  region: string;
  /** Real local vendors (warm / filling); ignored while cold. */
  vendors: RegionVendor[];
}

/** Deadpan statuses for the three ghost placeholders while a region is cold. */
const GHOST_STATUS = [
  "Decoding signage…",
  "Guessing the hours…",
  "Pricing at $0.00…",
] as const;

/** "Dep du Coin" → "DC"; "Night Owl Provisions" → "NO". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** "corner_store" → "Corner store". */
function humanizeKind(kind: string): string {
  const spaced = kind.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function NearbyVendors({ phase, region, vendors }: NearbyVendorsProps) {
  const cold = phase === "cold";

  // A warm region with no local vendors has nothing to show here.
  if (!cold && vendors.length === 0) return null;

  const eyebrow = cold ? "Nearby, pending" : "Nearby vendors";
  const note = cold
    ? `Local vendors are being indexed for ${region}. They slot in here.`
    : phase === "filling"
      ? "Indexed. Say hello."
      : `Local to ${region}.`;

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <span className="text-sm text-fg-faint">{note}</span>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {cold
          ? GHOST_STATUS.map((status, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 rounded-sm border border-dashed border-perf p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="h-11 w-11 flex-none rounded-full border border-dashed border-perf" />
                  <div className="flex flex-1 flex-col gap-2.5">
                    <span className="block h-3 w-3/5 rounded-sm bg-sunken" />
                    <span className="block h-2 w-2/5 rounded-sm bg-sunken" />
                  </div>
                </div>
                <div className="border-t border-dashed border-perf" />
                <div style={{ animation: "ncGhost 2.4s ease-in-out infinite" }}>
                  <div className="font-mono text-2xs font-bold uppercase tracking-label text-fg-faint">
                    Vendor pending
                  </div>
                  <div className="mt-1 font-mono text-2xs uppercase tracking-label text-fg-faint">
                    {status}
                  </div>
                </div>
              </div>
            ))
          : vendors.map((v, i) => (
              <div
                key={v.id}
                style={
                  phase === "filling"
                    ? {
                        animation: `ncSettle 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both`,
                      }
                    : undefined
                }
              >
                <Card perforated={false}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-hairline bg-sunken font-mono text-sm font-bold text-fg-strong">
                      {initials(v.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-md font-bold leading-tight text-fg-strong">
                        {v.name}
                      </div>
                      <div className="mt-0.5 font-mono text-2xs text-fg-muted">
                        {humanizeKind(v.kind)}
                      </div>
                    </div>
                    <span className="whitespace-nowrap font-mono text-sm text-fg">
                      &#x22C6; {v.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="my-3.5 border-t border-dashed border-perf" />
                  <div className="font-mono text-2xs uppercase tracking-label text-fg-faint">
                    {v.itemCount} item{v.itemCount === 1 ? "" : "s"} &middot; open,
                    supposedly
                  </div>
                </Card>
              </div>
            ))}
      </div>
    </section>
  );
}
