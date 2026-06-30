/**
 * /track/[orderId] — live order tracker stub (Phase 5).
 *
 * The full MapLibre tracking map is a later phase. This server component proves
 * the redirect target loads a real order from the DB and 404s anything else.
 * Structure mirrors app/product/[id]/page.tsx: params await, UUID guard,
 * server Supabase client, maybeSingle(), notFound() on miss.
 *
 * Uses cookies() via createClient() → dynamic rendering (correct: users must
 * see their own orders via RLS, not a shared static page).
 */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/catalog/SiteHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Stamp } from "@/components/ui/Stamp";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TrackPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  // Guard malformed IDs before hitting the DB.
  if (!UUID_RE.test(orderId)) notFound();

  const supabase = await createClient();

  // Orders are RLS-scoped to their owner: a stranger (or no-session) gets no row
  // and correctly 404s. maybeSingle() avoids a thrown error on an empty result.
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, postal_code, fake_total_cents, created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) notFound();

  const orderIdShort = `NC-${orderId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  const placed = new Date(order.created_at).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-[1100px] px-7 pb-24 pt-10">
        {/* Header */}
        <div className="mb-8">
          <Eyebrow>Tracking &middot; {orderIdShort}</Eyebrow>
          <h1 className="mb-2 mt-3 font-display text-3xl font-extrabold tracking-tight text-fg-strong">
            It hasn&rsquo;t moved.
          </h1>
          <p className="max-w-[52ch] text-base leading-relaxed text-fg-muted">
            The courier is aware of your order. The courier is always aware. The
            courier is not moving.
          </p>
        </div>

        {/* Order details card */}
        <div className="mb-8 max-w-[520px] rounded-md border border-hairline bg-card p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
                Order ID
              </div>
              <div className="font-mono text-xs tabular-nums text-fg-strong">
                {order.id}
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
                Status
              </div>
              <div className="font-mono text-xs uppercase tracking-wide text-fg-strong">
                {order.status ?? "in_transit"}
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
                Destination
              </div>
              <div className="font-mono text-xs uppercase text-fg-strong">
                {order.postal_code}
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
                Placed
              </div>
              <div className="font-mono text-xs text-fg-strong">{placed}</div>
            </div>
          </div>

          <hr className="my-5 border-0 border-t border-dashed border-hairline" />

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-fg-muted">
              ETA
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wide text-fg-strong">
              Never
            </span>
          </div>
        </div>

        {/* Stamp */}
        <div className="flex items-center gap-4">
          <Stamp label="Never arrived" />
          <p className="max-w-[36ch] font-mono text-2xs text-fg-faint">
            Live map tracking is on its way — which is more than we can say for
            your order.
          </p>
        </div>
      </main>
    </>
  );
}
