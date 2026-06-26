# Rule: Testing & the verify gate

A plausible-looking implementation that doesn't handle edge cases is the default failure mode.
The fix is verification on every slice. If you can't verify it, don't call it done.

## The verify gate (run before any slice is "done")

```
npm run verify        # typecheck + lint + unit tests, all green
```

Plus, for any change that touches the core loop (browse → cart → checkout → track):

```
npm run test:e2e      # Playwright covers the full anonymous loop
```

CI runs `verify` on every PR. The DB workflow additionally fails a PR if `types/database.ts`
is stale (see `.github/workflows/db.yml`).

## `lib/sim` is test-first (required)

The simulation engine is pure, deterministic TypeScript, so it gets real unit tests, and they
are written BEFORE the implementation:

1. Write Vitest tests for `step()` first, including these invariants:
   - **Never-delivered:** for all elapsed times, `status` never reaches a delivered state and
     `progress` never resolves to "arrived". This is the product; pin it with a test.
   - Determinism: same `SimConfig` + same elapsed time → identical `SimFrame`.
   - Monotonic-ish progress toward (but never reaching) the destination before it stalls/loops.
2. Then implement `step()` to pass them.
3. Any change to `lib/sim` updates its tests in the same commit.

`lib/sim` may not import React/DOM/network/Supabase — if a test needs those, the logic is in the
wrong layer.

## What to test where

- **Unit (Vitest):** `lib/sim` (above), `lib/utils` (currency in integer cents, geo helpers),
  cart math, filter logic.
- **Component:** cart drawer behavior, checkout resolving to $0.00, the never-arrived stamp render.
- **E2E (Playwright):** the full anonymous core loop, ending on the tracker that never completes.

## Accessibility checks (any new interactive UI)

- Keyboard-navigable with visible focus.
- `prefers-reduced-motion` respected — the courier animation degrades to a static/stepped state.

## Definition of Done checklist (per slice / PR)

- [ ] Schema changes are migrations (nothing done in prod Studio / via MCP mutation).
- [ ] `types/database.ts` regenerated and committed; `db:types:check` passes.
- [ ] RLS policy in the same migration as its owner-scoped table.
- [ ] `lib/sim` stayed pure; its tests updated; never-delivered invariant still holds.
- [ ] `npm run verify` green; e2e green if the core loop changed.
- [ ] No `service_role` key in client code or committed env.
- [ ] No real-brand names/logos/UI.
- [ ] Reduced-motion + keyboard verified for new interactive UI.
- [ ] Implementation matches the provided Claude Design screen (no invented layout).
