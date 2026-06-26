# NeverComes — Claude Code Project Guide

NeverComes is a deadpan parody "dopamine site": a simulated shopping / food-delivery
experience that recreates the full ritual of buying — browse, cart, checkout, live courier
tracking — except nothing ships and no money moves. The order is perpetually in transit and
never arrives. All the dopamine of buying, none of the receipt.

---

## HARD RULES — check before every action (non-negotiable)

1. **No real commerce.** No payments, no real inventory, no fulfillment. Orders are
   append-only fake records that never complete.
2. **Migration-first DB.** Every schema change is a committed SQL migration. Never edit the
   production database by hand. Prefer the CLI + migrations over any Studio/MCP mutation.
   → see `rules/supabase_migrations.md`
3. **No ORM.** Type-safety comes from Supabase-generated `types/database.ts`, not Prisma/Drizzle.
4. **`lib/sim` stays pure.** Zero React / DOM / network / Supabase imports. Deterministic and
   unit-tested. → see `rules/testing.md`
5. **Anonymous-first.** The full core loop works with no signup. Auth is an upgrade, never a gate.
6. **`service_role` key is server-only.** Never in client code, never committed, never
   prefixed `NEXT_PUBLIC_`. The anon key is public by design.
7. **No real-brand impersonation.** Vendor names / logos / UI are original or clearly fictional
   (no Amazon / Uber Eats / SkipTheDishes marks).
8. **Build to the design, don't invent UI.** → see "Design protocol" below and `knowledge/design.md`.

If a hard rule conflicts with a faster shortcut, the rule wins.

---

## How we work

- **One phase at a time.** Follow `knowledge/execution-phases.md` in order. Do not start a
  phase until the previous phase's Definition of Done is met (and its design exists, if required).
- **Plan before code.** For any non-trivial slice, enter plan mode, write the plan to
  `tasks/PHASE-<n>.md` as a checklist, and wait for my approval before implementing.
- **Verify or it didn't happen.** Every slice ends with `npm run verify` green
  (typecheck + lint + unit), plus e2e for any change to the core loop. If you can't verify it,
  don't call it done.
- **Protect context.** Use subagents for codebase exploration and for reviewing a diff in a
  fresh context. Keep the Supabase MCP read-only + project-scoped. I will `/clear` between phases.
- **Commit per slice.** One feature = one focused commit, so a bad slice is one `git revert`.

Prefer phrasing: when unsure, ask one focused question rather than guessing.

---

## Project map

- `knowledge/spec.md` — **v1 product + technical spec. AUTHORITATIVE for v1 scope** — where it
  disagrees with the older planning docs, the spec wins. READ this first.
- `rules/supabase_migrations.md` — DB workflow, prod↔local sync, scripts, MCP guardrails (READ before any DB work)
- `rules/testing.md` — test requirements + the verify gate (READ before writing tests or `lib/sim`)
- `knowledge/architecture.md` — system design, stack, data model, scalability
- `knowledge/design.md` — design system + the Claude Design handoff workflow (desktop-web first)
- `knowledge/design-prompts.md` — the per-phase prompts you paste into Claude Design
- `knowledge/execution-phases.md` — the ordered build plan (the spine of the work)
- Full planning docs (in repo): `docs/nevercomes-architecture.md`, `docs/nevercomes-codebase-and-requirements.md`

Don't `@`-embed the large docs into context wholesale — open the specific section you need.

---

## Design protocol

The **design system** (colors, type, spacing, primitives) is ready and lives in
`knowledge/design.md` — treat it as the source of truth for *look* from Phase 1 onward.

The **product design** (actual screen layouts) is produced later, screen-by-screen, in
**Claude Design**, just ahead of each feature phase. Rules:

- A feature phase that has a UI is **gated on its Claude Design screen existing.** If I haven't
  provided the design for a screen yet, stop and ask — **do not invent the layout.**
- When I provide a design, build the real Next.js implementation **toward it** using the design
  tokens. The Claude Design output is the visual spec, not shippable code.
- `knowledge/execution-phases.md` marks which phases are design-gated.

---

## Stack (locked)

Next.js 14 App Router · TypeScript · Tailwind · Zustand · MapLibre GL JS (free tiles) ·
Supabase (Postgres/Auth/Realtime/Storage, migration-first, no ORM) · Vercel ·
Python + LangGraph for the offline catalog generator (later phase). See `knowledge/architecture.md`.
