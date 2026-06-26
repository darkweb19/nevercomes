# NeverComes

A deadpan parody "dopamine site": a simulated shopping / food-delivery experience that recreates
the full ritual of buying — browse, cart, checkout, live courier tracking on a real map — except
the order **never arrives**. No payments, no real inventory, no fulfillment. All the dopamine of
buying, none of the receipt.

This repository ships with a complete planning + build kit. **Start with the spec.**

## Read order

1. `.claude/knowledge/spec.md` — **v1 product + technical spec (authoritative for v1 scope).**
2. `.claude/knowledge/execution-phases.md` — the ordered build plan (Phase 0 → 12).
3. `.claude/knowledge/architecture.md` — condensed system design / stack / data model.
4. `docs/nevercomes-architecture.md` + `docs/nevercomes-codebase-and-requirements.md` — full planning docs.

## What's here

```
.claude/
├── CLAUDE.md                     # the spine Claude Code reads every session
├── commands/                     # /new-feature, /deploy, /test-all
├── rules/                        # supabase_migrations.md, testing.md
├── knowledge/                    # spec.md, architecture.md, design.md, design-prompts.md, execution-phases.md
└── agents/                       # code-reviewer, test-runner
.github/workflows/
├── keep-alive.yml                # pings Supabase so the free tier never pauses
└── db.yml                        # deploys migrations on merge; fails PRs with stale types
docs/                             # full architecture + codebase/requirements specs
package.json                      # verify + db:* prod/local sync scripts
.env.example
SETUP.md                          # how to wire it all up
```

## Quick start

1. Read `SETUP.md`.
2. Scaffold the app (Phase 0), then merge `package.json` scripts in.
3. Add the GitHub secrets listed in `SETUP.md`.
4. Connect your design system to Claude Design and the Supabase MCP (read-only) to Claude Code.
5. Run `/new-feature 0` and proceed one phase at a time.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Zustand · MapLibre GL JS · self-hosted OSRM
(Docker on Railway) · Supabase (Postgres/Auth/Realtime/Storage, migration-first, no ORM) ·
Vercel · Python + LangGraph (offline catalog generator). See `.claude/knowledge/architecture.md`.
