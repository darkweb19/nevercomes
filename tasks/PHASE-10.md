# Phase 10 (slice: Screen 1) — Leaderboard  [design-gated: design PROVIDED 2026-07-05]

Design: Claude Design project `657fd11d-bea5-449c-8318-3581a3704a93`,
`NeverComes Viral Surfaces.dc.html` (decoded copy at `/tmp/nc-design/viral-surfaces.html`).
Scope: **Screen 1 only** (leaderboard page). Screens 2 (OG share card) and 3 (live counters +
share moment) are later Phase-10 slices. Directive from Sujan: build Screen 1 **with less UI** —
fewer words, fewer numbers, fewer controls; the joke carries the screen.

## Decisions (D1–D7) — APPROVED 2026-07-05

- **D1 — Less-UI cuts (deliberate deviations from the design, per instruction):**
  (a) ONE ranking — MOST SAVED. No flavor tabs, no THIS WEEK/ALL TIME toggle.
  (b) No side panel — single centered column (~880px). Global stats compress to ONE quiet mono
      strip under the table: `128,406 never delivered · $2.1M saved · 0 delivered, ever`
      (anchor stat in accent).
  (c) Hero = eyebrow "Leaderboard" + title "Ranked by how little arrived." — the explainer
      paragraph is cut.
  (d) Table = 4 columns: RANK · PSEUDONYM · SAVED · LONGEST WAIT. The ORDERS column and the
      struck-through "charged" subline are cut.
  (e) The "N shopping now" header pill is cut (it's Screen 3's live counter — not this slice).
  Kept: YOU row pinned under top 10, loading skeleton, empty state (one-liner + CTA +
  "Order nothing. Rise."), footer tagline.
- **D2 — Data via one SECURITY DEFINER function** `leaderboard()` in a new migration: returns
  top-10 anonymized rows (pseudonym seed = short hash of profile_id — raw profile UUIDs never
  leave the DB) + the caller's own row (rank, saved_cents, orders, wait via `auth.uid()`,
  null when signed out / no orders) + global totals. `GRANT EXECUTE` to anon+authenticated;
  pinned `search_path`. No new tables; `orders` RLS untouched.
- **D3 — Pseudonyms are pure TS** (`lib/viral/pseudonym.ts`): deterministic seed → adjective +
  noun + 4-digit code ("Patient Stranger #4821" style, original words). Test-first.
- **D4 — Aggregation lives in SQL, shaping in pure TS** (`lib/viral/leaderboard.ts`): cents →
  `$1,204.50`, wait ms → `142 DAYS`, rank `01`. Integer cents only. Test-first.
- **D5 — Route** `app/leaderboard/page.tsx`: dynamic server component on the /me pattern +
  `loading.tsx` skeleton. SiteHeader gains a "Leaderboard" link (design shows it in the nav).
- **D6 — Theme:** build with semantic tokens (fg-strong / hairline / accent) like every page;
  works in both themes, no hardcoded dark palette.
- **D7 — a11y:** row links none (static table); focus-visible on CTA + nav link;
  skeleton pulse `motion-safe:` only.

## Slice A — migration + types
- [x] `npm run db:new -- leaderboard_fn` — `leaderboard()` security-definer fn (top-10 aggregates
      over `orders` grouped by `profile_id`, caller row, global totals; hashed pseudonym seed).
- [x] `npm run db:reset` clean → `npm run db:types` → commit migration + regenerated types together.

## Slice B — pure logic, test-first
- [x] `tests/unit/pseudonym.test.ts` — determinism (same seed → same name), distinct-ish seeds,
      format `Word Word #0000`.
- [x] `tests/unit/leaderboard-format.test.ts` — money from integer cents, wait-days floor,
      rank padding, empty caller row.
- [x] `lib/viral/pseudonym.ts` + `lib/viral/leaderboard.ts` to green. Zero React/Supabase imports.
- [x] `npm run verify` green → commit.

## Slice C — /leaderboard page to the design (Sonnet builds, Fable reviews)
- [x] `components/viral/LeaderboardTable.tsx` — header row, top-10 receipt rows (perforation
      dividers), pinned accent YOU row; empty + loading variants per D1.
- [x] `app/leaderboard/page.tsx` (dynamic; calls `leaderboard()` via typed rpc) +
      `app/leaderboard/loading.tsx`; global-stats mono strip; footer tagline.
- [x] `components/catalog/SiteHeader.tsx` — add "Leaderboard" nav link.
- [x] `npm run verify` + `npm run build` clean → commit.

## Slice D — e2e + DoD review + PR
- [x] `tests/e2e/leaderboard.spec.ts` — (1) fresh visitor → page renders, no gate, empty-or-
      populated; (2) place an order via the core loop → leaderboard shows YOU row with a rank.
- [x] Full gate: `npm run verify` + `npm run test:e2e` (SiteHeader touches the core loop).
      `lib/sim` zero-diff.
- [x] `code-reviewer` agent on `main...HEAD`; fix real findings (ARIA table roles,
      tokenized YOU-row border; 'hand-edited types' blocker + purity-disable claim both
      disproven with evidence).
- [x] Branch `phase-10-leaderboard`, PR #22 → `main` (part of #10). CI: watching.

## Verify commands
`npm run verify` · `npm run test:e2e` · `npm run db:reset` (migration rebuilds) ·
`npm run db:types` (no diff after regen)

---

# Phase 10 (slices: Screens 2–3) — OG share cards + live counters + share moment
[design-gated: PROVIDED — same `viral-surfaces.html`, §s2 + §s3] — STARTED 2026-07-05

Branch `phase-10-viral-share`. Orchestration: Fable plans/integrates/verifies; three
parallel Sonnet subagents build disjoint files.

## Decisions (D8–D14) — per the D1 "less UI" precedent

- **D8 — Self-contained share links.** `/track` is RLS owner-scoped (strangers 404), so
  shares point at a public `/w` surface whose data travels in the query string:
  `?v=order&c=NC-XXXX&t=<epochMs>` / `?v=me&s=<cents>&o=<n>&w=<days>&p=<seed>`.
  No DB read, no migration, no privacy leak; forgeable and that's fine (parody).
  Contract = `lib/viral/share.ts` (pure, tested — Fable-owned).
- **D9 — OG images** via `next/og` `ImageResponse` at `/api/og`, 1200×630, flat paper
  palette per Screen 2. Variants 2a (order) + 2b (me). **2c (rank) deferred** — the
  leaderboard has no share affordance by D1; revisit if Sujan wants it.
- **D10 — `/w` page = the designed card + one CTA.** No invented layout: it renders the
  OG card artwork itself, plus `generateMetadata` OG/twitter tags for unfurls.
- **D11 — Counters are deterministic theater.** `lib/viral/counters.ts` (pure, test-first)
  maps a timestamp → plausible `shoppersNow` / `ordersInTransit`; client ticks every ~4s.
  Landing SocialProof strip upgraded to Screen 3's three cells (SHOPPING RIGHT NOW /
  ORDERS NEVER ARRIVING / DELIVERED, EVER = 0 in accent). Landing stays static; no DB.
- **D12 — Compact header counter pill CUT** (same less-UI reasoning as D1e).
- **D13 — Reduced motion:** no pulsing dots, stepped number updates (`motion-safe:` only).
- **D14 — /me pseudonym** computed server-side as `md5(user.id).slice(0,12)` — byte-for-byte
  the seed `leaderboard()` emits, so /me and leaderboard agree on your name.

## Slice E — Screen 2: `/w` + `/api/og` (Agent A, Sonnet)
- [x] `app/api/og/route.tsx` — ImageResponse; variants order/me per design 2a/2b;
      vendored TTF fonts (committed, OFL-licensed); 400 on malformed params.
- [x] `app/w/page.tsx` — public share landing: designed card + CTA + OG meta tags.
      (Fable review fix: card type scales with container via `cqw`, not viewport `vw`;
      `metadataBase` added to root layout for absolute OG URLs.)
- [x] Local check: `curl -sI` both variants → 200 `image/png` (valid 1200×630 PNG
      confirmed with `file`); /w order+me → 200, malformed → 404; malformed og → 400.

## Slice F — Screen 3: live counters on landing (Agent B, Sonnet)
- [x] `tests/unit/counters.test.ts` FIRST (determinism, plausible bounds, drift).
- [x] `lib/viral/counters.ts` pure; `components/viral/LiveCounters.tsx` client ticker.
- [x] `components/landing/SocialProof.tsx` strip → Screen 3's three cells;
      `NeverCounter` absorbed/removed. Reduced-motion per D13.

## Slice G — Screen 3: share moment (Agent C, Sonnet)
- [x] `components/viral/ShareWait.tsx` — copy-link card; "LINK COPIED. AS PREDICTED."
- [x] Tracker panel + /me integration (order + me payloads via `lib/viral/share.ts`;
      /me guards confirmed: early-returns cover no-user and zero-orders before the
      new `orders[orders.length - 1]` read).
- [x] `tests/e2e/share.spec.ts` — order → tracker → share → open link logged-out →
      public card renders; OG endpoint 200.

## Integration (Fable)
- [x] Review each agent diff; `npm run verify` + `npm run test:e2e` full gate —
      154 unit + 8/8 e2e green; `lib/sim` zero-diff vs main.
- [x] `code-reviewer` agent on `main...HEAD` — verdict **ship, zero blockers** (all hard
      rules pass; this time the reviewer empirically confirmed `react-hooks/purity` is
      real instead of repeating the past false claim). Applied 2 nits: explicit
      focus-visible ring on ShareWait's button; OG font cache no longer caches a
      rejection. Rejected 1 with evidence: design §s3 explicitly wants counters to keep
      stepped text updates under reduced motion — freezing them would deviate.
- [x] Commit per slice (`0daaee9` E / `e42eac0` F / `443a48b` G + review-fix commit);
      PR → `main`.
