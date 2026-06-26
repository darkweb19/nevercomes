# NeverComes — .claude setup

Drop these into the **repo root**. Claude Code auto-loads `.claude/` on every session.

```
.claude/
├── CLAUDE.md                     # the spine: hard rules, how-we-work, phase + design protocol
├── commands/
│   ├── new-feature.md            # /new-feature [phase] → plan-first kickoff for a phase
│   ├── deploy.md                 # /deploy [preview|prod] → safe pre-deploy checklist
│   └── test-all.md               # /test-all → run the full verify gate
├── rules/
│   ├── supabase_migrations.md    # migration-first, no-ORM, prod↔local sync, MCP guardrails
│   └── testing.md                # the verify gate + test-first lib/sim
├── knowledge/
│   ├── spec.md                   # v1 spec — AUTHORITATIVE for v1 scope (read first)
│   ├── architecture.md           # condensed system design / stack / data model
│   ├── design.md                 # design system tokens + Claude Design handoff (desktop-web first)
│   ├── design-prompts.md         # per-phase prompts to paste into Claude Design
│   └── execution-phases.md       # the ordered build plan (Phase 0 → 12)
└── agents/
    ├── code-reviewer.md          # fresh-context diff review vs the Definition of Done
    └── test-runner.md            # runs the verify gate in isolation

.github/workflows/
├── keep-alive.yml                # pings Supabase twice a week so the free tier never pauses
└── db.yml                        # deploys migrations on merge; fails PRs with stale types

package.json                      # scripts: verify + the db:* prod/local sync commands
.env.example                      # required env vars (no secrets)
.gitignore
README.md                         # project overview + read order
docs/
├── nevercomes-architecture.md           # full architecture & project plan
└── nevercomes-codebase-and-requirements.md   # full codebase structure & build requirements
```

## First-time steps

1. Scaffold the app (Phase 0) — `create-next-app` etc — then **merge** the `package.json`
   scripts block in (don't blindly overwrite your generated one).
2. Add repo secrets in GitHub → Settings → Secrets and variables → Actions:
   - Keep-alive: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   - DB deploy: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`
3. Configure the Supabase MCP for Claude Code (read-only, project-scoped) per
   `.claude/rules/supabase_migrations.md`.
4. Start building: run `/new-feature 0` and proceed one phase at a time.

## How the design handoff works

The design **system** (tokens) is in `knowledge/design.md` and is used from Phase 1.
The **product design** (screens) comes from Claude Design just before each design-gated phase —
paste the screen and Claude Code builds toward it. It will refuse to invent a layout for a
design-gated phase if you haven't provided the screen yet (by design).
