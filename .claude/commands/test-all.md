---
description: Run the full verification gate (typecheck, lint, unit, and e2e) and report results.
---

Run the project's verification gate and report back concisely.

1. `npm run verify` — typecheck + lint + unit tests.
2. `npm run test:e2e` — Playwright e2e of the anonymous core loop (browse → cart → checkout → track).

If anything fails:
- Show the failing output (trimmed to the relevant part).
- Diagnose the root cause before proposing a fix.
- Pay special attention to `lib/sim`: the **never-delivered invariant** must hold — the tracker
  must never reach a delivered state.

Do not declare success unless both commands are green. Summarize: what passed, what failed, and
the single next action.
