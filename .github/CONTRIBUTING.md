# Contributing — branch & PR workflow

We work **one feature (phase/slice) per branch**, with **multiple commits per branch**.
The branch tells one coherent story; the PR is the review unit.

## Workflow

1. **Branch off `main`** per feature:
   `git switch -c phase-<n>-<short-name>` (e.g. `phase-4-cart`).
2. **Commit freely** as you go — small, focused commits within the branch are encouraged.
3. **Verify before opening the PR:** `npm run verify` (and `npm run test:e2e` if the
   core loop changed) must be green.
4. **Open a PR into `main`** using the template; link the phase issue with `Closes #<n>`.
5. **Merge** once the Definition of Done checklist passes and CI is green.

## Rules that gate a merge

See `.claude/rules/` and `.claude/CLAUDE.md`. Highlights:

- Migration-first DB — every schema change is a committed SQL migration; never edit prod by hand.
- `lib/sim` stays pure (no React/DOM/network/Supabase) and keeps the never-delivered invariant.
- `service_role` key is server-only; the anon key is public by design.
- No real-brand impersonation; build to the provided Claude Design screen, don't invent layout.

`main` is the integration branch. One feature = one branch = one PR.
