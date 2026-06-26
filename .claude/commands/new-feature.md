---
description: Start a feature/phase — read the phase spec, write a plan, wait for approval before coding.
argument-hint: "[phase number or feature name]"
---

You are starting work on: **$ARGUMENTS**

Follow the project protocol exactly:

1. Open `.claude/knowledge/execution-phases.md` and load the spec for this phase (or the next
   incomplete phase if I didn't specify one). Confirm the **previous phase's Definition of Done**
   is met before proceeding; if not, stop and tell me what's outstanding.
2. If this phase is **[design-gated]**, confirm the Claude Design screen(s) for it have been
   provided. If not, STOP and ask me for the design — do NOT invent the layout.
3. Re-read the relevant rules for this phase: `.claude/rules/supabase_migrations.md` (any DB work)
   and `.claude/rules/testing.md` (tests / `lib/sim`).
4. Enter plan mode. Write an ordered, checkable plan to `tasks/PHASE-<n>.md` with: exact files to
   create/change, the approach, and the verify commands that will prove it done. Keep scope tight
   to this phase only.
5. **Stop and present the plan for my approval. Do not write implementation code yet.**

After I approve, implement in small commits, run `npm run verify` (and `npm run test:e2e` if the
core loop changed), and check items off `tasks/PHASE-<n>.md` as you go. Honor every HARD RULE in
`.claude/CLAUDE.md`.
