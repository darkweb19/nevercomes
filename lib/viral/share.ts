// Share-link contract for the viral surfaces (Phase 10, Screens 2–3).
// Pure TS — no React, no Supabase, no network (same rules as lib/sim).
//
// Share links are SELF-CONTAINED: everything the public /w page and the
// /api/og image need travels in the query string. No DB read, so a shared
// link never touches RLS-scoped rows, and forging one is harmless theater.

export interface OrderShare {
  v: "order";
  /** Public short code, e.g. "NC-4B21A0". */
  code: string;
  /** Order created_at as epoch milliseconds — days-in-transit computes live. */
  createdAtMs: number;
}

export interface MeShare {
  v: "me";
  savedCents: number;
  orders: number;
  waitDays: number;
  /** 12-char hex pseudonym seed — same substr(md5(profile_id),1,12) the DB emits. */
  seed: string;
}

export type SharePayload = OrderShare | MeShare;

const CODE_RE = /^NC-[A-Z0-9]{4,10}$/;
const SEED_RE = /^[a-f0-9]{4,16}$/;

/** Builds the site-relative share path, e.g. "/w?v=order&c=NC-4B21A0&t=1751700000000". */
export function buildSharePath(payload: SharePayload): string {
  const q = new URLSearchParams();
  q.set("v", payload.v);
  if (payload.v === "order") {
    q.set("c", payload.code);
    q.set("t", String(payload.createdAtMs));
  } else {
    q.set("s", String(payload.savedCents));
    q.set("o", String(payload.orders));
    q.set("w", String(payload.waitDays));
    q.set("p", payload.seed);
  }
  return `/w?${q.toString()}`;
}

type RawParams = Record<string, string | string[] | undefined>;

function one(params: RawParams, key: string): string | null {
  const value = params[key];
  return typeof value === "string" ? value : null;
}

function nonNegativeInt(raw: string | null, max: number): number | null {
  if (raw === null || !/^\d{1,15}$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= 0 && n <= max ? n : null;
}

/**
 * Strict parse of /w searchParams (Next.js shape). Returns null on anything
 * malformed — callers treat null as "render the generic empty card / 404".
 */
export function parseShareParams(params: RawParams): SharePayload | null {
  const v = one(params, "v");

  if (v === "order") {
    const code = one(params, "c");
    const createdAtMs = nonNegativeInt(one(params, "t"), 4_102_444_800_000); // ≤ year 2100
    if (code === null || !CODE_RE.test(code) || createdAtMs === null) return null;
    return { v: "order", code, createdAtMs };
  }

  if (v === "me") {
    const savedCents = nonNegativeInt(one(params, "s"), 1_000_000_000); // ≤ $10M
    const orders = nonNegativeInt(one(params, "o"), 100_000);
    const waitDays = nonNegativeInt(one(params, "w"), 100_000);
    const seed = one(params, "p");
    if (
      savedCents === null ||
      orders === null ||
      waitDays === null ||
      seed === null ||
      !SEED_RE.test(seed)
    ) {
      return null;
    }
    return { v: "me", savedCents, orders, waitDays, seed };
  }

  return null;
}

/** Whole days in transit; never negative (clock skew, forged future t). */
export function daysInTransit(createdAtMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - createdAtMs) / 86_400_000));
}
