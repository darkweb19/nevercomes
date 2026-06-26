# Rule: Supabase — migration-first, no ORM, prod ↔ local in sync

This rule exists to prevent the failure mode from a previous project: a schema built by
clicking around in the production Studio, with no migration record, leaving the codebase blind
to the database and onboarding impossible. Follow it on every DB change.

## The rules

1. **Production is never edited by hand.** No table/column/policy/function created in the prod
   Studio. The migrations in `supabase/migrations/` are the only source of truth for schema.
2. **Every schema change is a committed migration.**
3. **`types/database.ts` is generated, never hand-edited**, and regenerated on every schema change.
4. **Schema dev happens against the LOCAL database** (`npm run db:start`), not prod.
5. **RLS policies ship in the SAME migration as the table they protect** — never as an afterthought.
6. **No ORM.** Use `supabase-js` typed with the generated `Database` type.

## Keeping prod and local in sync (both directions)

Local and prod can drift. These are the two sync directions:

- **Pull prod → local** (adopt the live schema as a baseline, or recover from drift):
  `npm run db:pull` writes a migration capturing the remote schema. Then `npm run db:reset`
  rebuilds local from all migrations. Use this once at the start to rescue any existing
  clickops schema, and any time prod was changed outside the migration flow.
- **Push local → prod** (deploy your new migrations): `npm run db:push`. In practice this runs
  in CI on merge to `main` (`.github/workflows/db.yml`), not from a laptop.
- **Check drift anytime:** `npm run db:status` (`supabase migration list`) shows which
  migrations are applied locally vs remotely so you can see divergence at a glance.

Golden test that local == migrations: run `npm run db:reset` and confirm the rebuilt-from-scratch
local DB matches what you expect. If `db:pull` ever produces a non-empty diff against prod,
prod was edited out-of-band — fold that diff into a migration.

## Day-to-day: making a schema change

Pick the style that fits — both produce committed SQL:
- **Visual, then capture:** edit in the **local** Studio (`localhost:54323`), then
  `npm run db:diff -- <name>` writes the migration for you.
- **SQL directly:** `npm run db:new -- <name>` creates an empty migration; write the SQL.

Then: `npm run db:reset` → `npm run db:types` → commit the migration **and** the regenerated
types together. Open a PR. CI deploys on merge.

## First-time rescue of an existing clickops project

```bash
supabase login
supabase init
supabase link --project-ref <prod-ref>
npm run db:pull            # baseline migration from live schema
npm run db:reset           # confirm it rebuilds cleanly
# if push later complains the baseline already exists: supabase migration repair
```

## Onboarding a new developer (the whole thing)

```bash
git clone … && cd nevercomes
cp .env.example .env.local
npm install
npm run db:start           # local Supabase, migrations applied, seed loaded
npm run dev
```

No prod keys. The migrations ARE the schema.

## Supabase MCP guardrails

The Supabase MCP is a **read/inspect/draft** tool, never a schema-mutation tool. Using
`execute_sql` to `CREATE`/`ALTER` against the DB silently recreates the clickops problem.

- Run it **read-only and project-scoped**, pointed at **local or a dev project — never prod**:
  `https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true`
- Use it to: inspect the live schema, query data shape, verify RLS behavior, confirm a migration
  applied, debug "empty result → RLS or no data?".
- **Schema changes still flow through migrations.** The assistant drafts the migration SQL into
  `supabase/migrations/`; it is applied via `npm run db:push` (CLI/CI), not via the MCP.

## Scripts (see package.json)

`db:start db:stop db:reset db:new db:diff db:push db:pull db:status db:types db:types:linked db:sync`
