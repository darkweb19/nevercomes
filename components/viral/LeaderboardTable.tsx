/**
 * LeaderboardTable — server-safe presentation component.
 *
 * No "use client", no hooks, no Supabase. The page component does all data
 * fetching and shaping; this component only renders what it receives.
 */
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface LeaderboardRow {
  rank: string;
  name: string;
  code: string;
  saved: string;
  wait: string;
}

export interface YouData {
  rankLabel: string;
  name: string;
  code: string;
  saved: string;
  wait: string;
}

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  you?: YouData | null;
}

/**
 * Responsive 4-column grid: RANK · PSEUDONYM · SAVED · LONGEST WAIT.
 * On mobile the LONGEST WAIT column is hidden (hidden sm:block on that cell).
 */
const GRID =
  "grid grid-cols-[56px_1fr_120px] sm:grid-cols-[56px_1fr_120px_110px] items-center gap-3";

const HDR =
  "font-mono text-[10px] uppercase tracking-label text-fg-faint";

export function LeaderboardTable({ rows, you }: LeaderboardTableProps) {
  // ── Empty state ──────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <Card padded={false}>
        <div className="flex flex-col items-center gap-[18px] px-6 py-16 text-center">
          <p className="font-display text-xl font-bold text-fg-strong">
            Nobody has failed to receive anything here yet.
          </p>
          <p className="max-w-[40ch] text-sm text-fg-muted">
            Someone has to be first not to get their order.
          </p>
          <Link href="/browse">
            <Button variant="primary">Place an order to never receive</Button>
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-label text-accent">
            Order nothing. Rise.
          </p>
        </div>
      </Card>
    );
  }

  // ── Populated table ──────────────────────────────────────────────────────
  return (
    <Card padded={false}>
      <div role="table" aria-label="Leaderboard, ranked by money saved">
        {/* Header row */}
        <div role="row" className={`${GRID} px-6 py-3.5`}>
          <span role="columnheader" className={HDR}>
            Rank
          </span>
          <span role="columnheader" className={HDR}>
            Pseudonym
          </span>
          <span role="columnheader" className={`${HDR} text-right`}>
            Saved
          </span>
          <span
            role="columnheader"
            className={`${HDR} hidden text-right sm:block`}
          >
            Longest Wait
          </span>
        </div>

        {/* Data rows */}
        {rows.map((row) => (
          <div
            key={`${row.rank}-${row.code}`}
            role="row"
            className={`${GRID} border-t border-dashed border-hairline px-6 py-4`}
          >
            <span role="cell" className="font-mono text-sm font-bold text-fg-faint">
              {row.rank}
            </span>
            <span role="cell">
              <span className="font-display text-base font-semibold text-fg-strong">
                {row.name}
              </span>{" "}
              <span className="font-mono text-xs text-fg-faint">#{row.code}</span>
            </span>
            <span
              role="cell"
              className="text-right font-mono text-sm font-bold text-fg-strong"
            >
              {row.saved}
            </span>
            <span
              role="cell"
              className="hidden text-right font-mono text-sm text-fg sm:block"
            >
              {row.wait}
            </span>
          </div>
        ))}

        {/* YOU row — pinned after data rows, accent treatment */}
        {you && (
          <div
            role="row"
            className={`${GRID} border-t-[1.5px] border-dashed border-accent bg-accent-wash px-6 py-4`}
          >
            <span role="cell" className="font-mono text-sm font-bold text-accent">
              {you.rankLabel}
            </span>
            <span role="cell">
              <span className="font-display text-base font-bold text-fg-strong">
                YOU
              </span>{" "}
              <span className="font-mono text-xs text-fg-muted">
                &mdash; {you.name} #{you.code}
              </span>
            </span>
            <span
              role="cell"
              className="text-right font-mono text-sm font-bold text-fg-strong"
            >
              {you.saved}
            </span>
            <span
              role="cell"
              className="hidden text-right font-mono text-sm text-fg sm:block"
            >
              {you.wait}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
