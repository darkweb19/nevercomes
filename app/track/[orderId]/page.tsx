/**
 * /track/[orderId] — the live order tracker (Phase 7, THE hero screen).
 *
 * Server component: loads the order via RLS (owner-scoped — a stranger or
 * no-session gets no row and 404s), derives the display fields, and hands
 * off to the client TrackingView, which drives the never-arrives animation
 * from lib/sim (elapsed = now − created_at; ≥2 min ⇒ stamped immediately).
 *
 * Uses cookies() via createClient() → dynamic rendering (correct: users must
 * see their own orders via RLS, not a shared static page).
 */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/catalog/SiteHeader";
import { TrackingView } from "@/components/tracker/TrackingView";

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

  // RLS scopes this to the owner; maybeSingle() avoids a thrown error on an
  // empty result. The nested join pulls the vendor name off the first item's
  // product for the map's origin label (D5) — nullable end to end, since a
  // product may have been deleted (order_items.product_id is SET NULL).
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, postal_code, created_at, order_items(products(vendors(name)))",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) notFound();

  const shortCode = `NC-${order.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  const vendorName =
    order.order_items
      .map((item) => item.products?.vendors?.name ?? null)
      .find((name) => name !== null) ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {/* The tracker fills the rest of the viewport; TrackingView owns the
          two-column (map · panel) layout and stacks below lg. */}
      <main className="flex min-h-0 flex-1 flex-col">
        <TrackingView
          shortCode={shortCode}
          createdAtIso={order.created_at}
          vendorName={vendorName}
        />
      </main>
    </div>
  );
}
