## What & why

<!-- One feature per branch. Multiple commits in the branch are fine; the branch
     tells one story. Link the phase issue this PR closes. -->

Closes #

## Phase

<!-- e.g. Phase 4 — Cart -->

## Definition of Done (from rules/testing.md)

- [ ] Schema changes are migrations (nothing done in prod Studio / via MCP mutation)
- [ ] `types/database.ts` regenerated and committed; `db:types:check` passes
- [ ] RLS policy in the same migration as its owner-scoped table
- [ ] `lib/sim` stayed pure; its tests updated; never-delivered invariant still holds
- [ ] `npm run verify` green; e2e green if the core loop changed
- [ ] No `service_role` key in client code or committed env
- [ ] No real-brand names/logos/UI
- [ ] Reduced-motion + keyboard verified for new interactive UI
- [ ] Implementation matches the provided Claude Design screen (no invented layout)

## Verification

<!-- Paste the relevant `npm run verify` / `npm run test:e2e` output. -->
