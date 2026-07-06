// Shaping + formatting for the leaderboard() DB payload. Pure TS — no React,
// no Supabase, no network. Aggregation happens in SQL; everything display-
// facing happens here so it can be unit-tested with an injected clock.

import { formatCents } from "@/lib/utils/money";

const DAY_MS = 86_400_000;

export interface LeaderboardEntry {
  /** Short hash of the profile id — feed to pseudonymFromSeed. */
  seed: string;
  savedCents: number;
  orders: number;
  oldestOrderAt: string;
  rank: number;
}

export interface LeaderboardTotals {
  neverDelivered: number;
  savedCentsAll: number;
}

export interface LeaderboardData {
  rows: LeaderboardEntry[];
  you: LeaderboardEntry | null;
  totals: LeaderboardTotals;
}

const EMPTY: LeaderboardData = {
  rows: [],
  you: null,
  totals: { neverDelivered: 0, savedCentsAll: 0 },
};

function toEntry(value: unknown): LeaderboardEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.seed !== "string" ||
    typeof v.savedCents !== "number" ||
    typeof v.orders !== "number" ||
    typeof v.oldestOrderAt !== "string" ||
    typeof v.rank !== "number"
  ) {
    return null;
  }
  return {
    seed: v.seed,
    savedCents: v.savedCents,
    orders: v.orders,
    oldestOrderAt: v.oldestOrderAt,
    rank: v.rank,
  };
}

/** Tolerant parse of the leaderboard() jsonb payload — never throws. */
export function parseLeaderboard(payload: unknown): LeaderboardData {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return EMPTY;
  }
  const p = payload as Record<string, unknown>;

  const rows = Array.isArray(p.rows)
    ? p.rows.map(toEntry).filter((e): e is LeaderboardEntry => e !== null)
    : [];

  const totalsRaw =
    typeof p.totals === "object" && p.totals !== null
      ? (p.totals as Record<string, unknown>)
      : {};

  return {
    rows,
    you: toEntry(p.you),
    totals: {
      neverDelivered:
        typeof totalsRaw.neverDelivered === "number"
          ? totalsRaw.neverDelivered
          : 0,
      savedCentsAll:
        typeof totalsRaw.savedCentsAll === "number" ? totalsRaw.savedCentsAll : 0,
    },
  };
}

/** Top-10 rank column: "01" … "10". */
export function formatRank(rank: number): string {
  return String(rank).padStart(2, "0");
}

/** The YOU row's rank: "#4,802". */
export function formatRankLabel(rank: number): string {
  return `#${formatInt(rank)}`;
}

/** Whole days since the oldest still-in-transit order: "142 DAYS". */
export function formatWaitDays(oldestOrderAtIso: string, now: number): string {
  const days = Math.floor((now - Date.parse(oldestOrderAtIso)) / DAY_MS);
  if (days < 1) return "<1 DAY";
  return days === 1 ? "1 DAY" : `${days} DAYS`;
}

/** Global-strip money: exact under $10K, then "$128K", then "$2.2M". */
export function formatCompactCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars < 10_000) return formatCents(cents);
  const thousands = Math.round(dollars / 1000);
  if (thousands >= 1000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  return `$${thousands}K`;
}

export function formatInt(n: number): string {
  return n.toLocaleString("en-CA");
}
