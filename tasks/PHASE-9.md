# Phase 9 — Retention: /me + account upgrade  [design-gated: design PROVIDED 2026-07-04]

Design: Claude Design project `42ffcf29-3ad8-4a59-8295-a79e6ee7c0c1`, `Me Screen.dc.html`
(decoded copy at `/tmp/nc-design/me-screen.html`). Branch: `phase-9-retention`.
Plan + decisions D1–D7 approved 2026-07-04 (full text: `~/.claude/plans/precious-snuggling-zephyr.md`).

Decisions: D1 stats computed on read from `orders` (no migration; `user_stats` stays dormant;
streak = days since `profiles.created_at` + 1; `ordersDelivered` ≡ 0). D2 email-only upgrade via
`updateUser({email})` w/ `signInWithOtp` fallback for returning users. D3 Google button OMITTED
(no OAuth provider configured). D4 one SiteHeader stands; auth states live in an AccountStrip on
/me. D5 "Claimed" = `Stamp label="CLAIMED"`. D6 /me = dynamic server component on the /track
pattern; never-vs-transit per row via `SIM_DURATION_MS`; no session/no orders → empty state,
never a sign-in wall. D7 history pills `pulse={false}`; skeleton `motion-safe:` only.

## Slice 1 — pure logic, test-first (Fable)
- [x] `tests/unit/me-stats.test.ts` — computeStats (integer cents, `ordersDelivered === 0`
      invariant, streak w/ injected now) + deriveMilestones (thresholds, deterministic).
- [x] `tests/unit/date-format.test.ts` — formatShortDate ("JUST NOW" <10 min, "MAY 18" style,
      injected now).
- [x] `lib/me/stats.ts` + `lib/utils/date.ts` implemented to green. Pure TS, zero React/Supabase.
- [x] `pnpm verify` green → commit.

## Slice 2 — /me page + components to the design (Sonnet builds, Fable reviews)
- [x] `components/me/StatsCard.tsx`, `OrderHistoryList.tsx`, `MilestonesRow.tsx` (server-safe,
      tokens + existing `components/ui` primitives only, no new deps).
- [x] `app/me/page.tsx` (dynamic, RLS-scoped orders + profiles.created_at; empty state),
      `app/me/loading.tsx` (skeleton), `app/me/error.tsx` (retry).
- [x] `components/catalog/SiteHeader.tsx` — static NC avatar → `Link href="/me"`
      (aria-label "Your account").
- [x] `pnpm verify` + `pnpm build` clean + authed-SSR spot-check of /me → commit.

## Slice 3 — account upgrade UI (Sonnet builds, Fable reviews)
- [ ] `components/me/AccountStrip.tsx` — anonymous | signed-in (email + Sign out) | just-claimed
      (`Stamp label="CLAIMED"` + "just now") via browser client + onAuthStateChange.
- [ ] `components/me/ClaimHistoryCard.tsx` — idle → submitting → check-inbox | error;
      labeled Input, aria-live status; `updateUser({email})` → `signInWithOtp` fallback;
      email-only (Google omitted, D3).
- [ ] Wired into `app/me/page.tsx` (card only while anonymous). Keyboard + reduced-motion pass.
- [ ] `pnpm verify` green; manual Inbucket (`:54324`) email check flagged for Sujan → commit.

## Slice 4 — e2e + DoD review + PR (Fable)
- [ ] `tests/e2e/me-retention.spec.ts` — (1) fresh /me → empty state, no gate; (2) full loop →
      /me shows stats + IN TRANSIT row linking to tracker; (3) claim card → check-inbox state.
- [ ] Full gate: `pnpm verify` + `pnpm test:e2e` (SiteHeader touched core loop). `lib/sim`
      zero-diff.
- [ ] `code-reviewer` agent on `main...HEAD`; fix real findings.
- [ ] Push, PR → `main` (Closes #9 if exists), CI green.

## Out-of-band (deploy reminders, not code)
- [ ] Prod SMTP not configured — upgrade emails rate-limited (~2/hr) until an SMTP provider is
      set in the Supabase dashboard.
