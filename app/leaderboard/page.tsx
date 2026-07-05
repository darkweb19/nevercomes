/**
 * /leaderboard — public hall of records.
 *
 * Dynamic server component: reads auth cookies via createClient() so Next.js
 * never statically generates this route. leaderboard() is SECURITY DEFINER —
 * it resolves the caller's YOU row internally via auth.uid() and exposes only
 * hashed seeds + aggregates for everyone else.
 *
 * Anonymous-first: the full page renders without a session; YOU row is simply
 * absent. No sign-in wall.
 */
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/catalog/SiteHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LeaderboardTable } from "@/components/viral/LeaderboardTable";
import type { YouData } from "@/components/viral/LeaderboardTable";
import {
  parseLeaderboard,
  formatRank,
  formatRankLabel,
  formatWaitDays,
  formatCompactCents,
  formatInt,
} from "@/lib/viral/leaderboard";
import { pseudonymFromSeed } from "@/lib/viral/pseudonym";
import { formatCents } from "@/lib/utils/money";

// cookies() makes this dynamic; explicit annotation ensures it's never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard — NeverComes",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
  const now = Date.now();

  const { data } = await supabase.rpc("leaderboard");
  const board = parseLeaderboard(data);

  // Shape display rows — page does the formatting, LeaderboardTable stays dumb.
  const displayRows = board.rows.map((entry) => {
    const p = pseudonymFromSeed(entry.seed);
    return {
      rank: formatRank(entry.rank),
      name: p.name,
      code: p.code,
      saved: formatCents(entry.savedCents),
      wait: formatWaitDays(entry.oldestOrderAt, now),
    };
  });

  // Shape YOU row if the current session has a ranked entry.
  let youDisplay: YouData | null = null;
  if (board.you) {
    const entry = board.you;
    const p = pseudonymFromSeed(entry.seed);
    youDisplay = {
      rankLabel: formatRankLabel(entry.rank),
      name: p.name,
      code: p.code,
      saved: formatCents(entry.savedCents),
      wait: formatWaitDays(entry.oldestOrderAt, now),
    };
  }

  const { totals } = board;
  const isPopulated = board.rows.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[880px] px-5 pb-16 pt-14">
        {/* Page header — no explainer paragraph (deliberate, less UI) */}
        <div className="mb-11">
          <Eyebrow rule>Leaderboard</Eyebrow>
          <h1 className="mt-3.5 font-display text-3xl font-extrabold tracking-tight text-fg-strong md:text-4xl lg:text-5xl">
            Ranked by how little arrived.
          </h1>
        </div>

        {/* Leaderboard table */}
        <LeaderboardTable rows={displayRows} you={youDisplay} />

        {/* Global stats strip — hidden when empty (nothing meaningful to show) */}
        {isPopulated && (
          <div className="mt-6 text-center font-mono text-[11px] tracking-wide text-fg-faint">
            {formatInt(totals.neverDelivered)} NEVER DELIVERED&nbsp;&middot;&nbsp;
            {formatCompactCents(totals.savedCentsAll)} SAVED&nbsp;&middot;&nbsp;
            <span className="text-accent">0 DELIVERED, EVER</span>
          </div>
        )}

        {/* Not on the board — quiet reminder, no button (less UI) */}
        {isPopulated && !youDisplay && (
          <div className="mt-4 text-center font-mono text-[11px] uppercase tracking-label text-fg-faint">
            You&rsquo;re not on the board. Order nothing. Rise.
          </div>
        )}

        {/* Footer line — matches /me exactly */}
        <div className="mt-11 border-t border-hairline pt-6 text-center font-mono text-[11px] tracking-wide text-fg-faint">
          ALL THE DOPAMINE OF BUYING. NONE OF THE RECEIPT.
        </div>
      </main>
    </div>
  );
}
