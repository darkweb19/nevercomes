/**
 * /me — personal ledger.
 *
 * Dynamic server component: reads auth cookies via createClient() so Next.js
 * never statically generates this route. RLS scopes all queries to the current
 * (possibly anonymous) session — no explicit user-id filter needed.
 *
 * Anonymous-first: no user or no orders → empty state, never a sign-in wall.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/catalog/SiteHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatsCard } from "@/components/me/StatsCard";
import { OrderHistoryList } from "@/components/me/OrderHistoryList";
import { MilestonesRow } from "@/components/me/MilestonesRow";
import { computeStats, deriveMilestones } from "@/lib/me/stats";
import { SIM_DURATION_MS } from "@/lib/sim/constants";

// cookies() makes this dynamic; explicit annotation ensures it's never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your ledger — NeverComes",
};

export default async function MePage() {
  const supabase = await createClient();
  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
  const now = Date.now();

  // Auth check — null when there's no session at all (fresh browser, no cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <EmptyState />;
  }

  // RLS scopes both queries to the authenticated (possibly anonymous) user.
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, fake_total_cents, created_at, order_items(products(name, vendors(name)))",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (!orders || orders.length === 0) {
    return <EmptyState />;
  }

  // Profile for streak start date; fall back to oldest order if missing.
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .maybeSingle();

  const profileCreatedAt =
    profile?.created_at ??
    orders[orders.length - 1].created_at;

  // Build stat inputs — integers only, no floats.
  const orderInputs = orders.map((o) => ({
    fakeTotalCents: o.fake_total_cents,
    createdAt: o.created_at,
  }));

  const stats = computeStats(orderInputs, profileCreatedAt, now);
  const milestones = deriveMilestones(stats);

  // Build display rows — all nullable chains guarded.
  const rows = orders.map((order) => {
    const items = order.order_items ?? [];
    const lineCount = items.length;
    // products may be null if the product was deleted (SET NULL FK).
    const firstProduct = items[0]?.products ?? null;
    const vendorName = firstProduct?.vendors?.name ?? null;
    const firstName = firstProduct?.name ?? null;
    const itemSummary = firstName
      ? lineCount > 1
        ? `${firstName} + ${lineCount - 1} more`
        : firstName
      : "A few things";
    const isNever = now - Date.parse(order.created_at) >= SIM_DURATION_MS;

    return {
      id: order.id,
      vendorName,
      itemSummary,
      ghostTotalCents: order.fake_total_cents,
      createdAtIso: order.created_at,
      isNever,
    };
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1400px] px-5 pb-16 pt-14 md:px-12">
        {/* Page header */}
        <div className="mb-11">
          <Eyebrow rule>Your account</Eyebrow>
          <h1 className="mt-3.5 font-display text-3xl font-extrabold tracking-tight text-fg-strong md:text-4xl lg:text-5xl">
            /me
          </h1>
          <p className="mt-2.5 max-w-[52ch] text-base text-fg-muted md:text-md">
            A running record of everything that almost happened.
          </p>
        </div>

        {/* Stats */}
        <StatsCard stats={stats} />

        {/* Order history */}
        <div className="mt-11 flex flex-col gap-4">
          <Eyebrow>Order history</Eyebrow>
          <OrderHistoryList rows={rows} now={now} />
        </div>

        {/* Quiet milestones */}
        {milestones.length > 0 && (
          <div className="mt-11">
            <MilestonesRow milestones={milestones} />
          </div>
        )}

        {/* Footer line */}
        <div className="mt-11 border-t border-hairline pt-6 text-center font-mono text-[11px] tracking-wide text-fg-faint">
          ALL THE DOPAMINE OF BUYING. NONE OF THE RECEIPT.
        </div>
      </main>
    </div>
  );
}

/** Empty state — shown when there's no session or no orders. Never a sign-in wall. */
function EmptyState() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1400px] px-5 pb-16 pt-14 md:px-12">
        <div className="mb-11">
          <Eyebrow rule>Your account</Eyebrow>
          <h1 className="mt-3.5 font-display text-3xl font-extrabold tracking-tight text-fg-strong md:text-4xl lg:text-5xl">
            /me
          </h1>
          <p className="mt-2.5 max-w-[52ch] text-base text-fg-muted md:text-md">
            A running record of everything that almost happened.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-[460px]">
            <Card padded={false}>
              <div className="flex flex-col items-center gap-[18px] px-6 py-[72px] text-center">
                <p className="font-display text-xl font-bold text-fg-strong">
                  You haven&rsquo;t ordered anything yet.
                </p>
                <p className="max-w-[40ch] text-sm text-fg-muted">
                  Which, historically, checks out.
                </p>
                <Link href="/browse">
                  <Button variant="primary">Start a fake order</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
