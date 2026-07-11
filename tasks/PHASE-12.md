# Phase 12 — Remove AI catalog; ship static catalog as migration  [2026-07-11]

## Why

- The Phase 11 Python/LangGraph catalog worker never ran successfully in prod (service_role
  secrets not fully wired; generation never confirmed on the live database).
- Recurring cost: ~$0.50/region/run on Claude Haiku 4.5 × 10 GTA FSAs × ongoing cron = real
  spend for zero benefit while the catalog is fixed anyway.
- Complexity with no payoff: 108 pytest tests, a LangGraph pipeline, a preseed step, and a
  15-min cron for data that can ship as three `INSERT` statements.

## What changed

- **Deleted** `workers/catalog/` (Python worker — the only Anthropic SDK usage in the repo)
- **Deleted** `.github/workflows/catalog.yml` (*/15 cron + preseed dispatch)
- **Removed** `ANTHROPIC_API_KEY` from `.env.example` (and its "Offline catalog worker ONLY" comment)
- **Updated** `docs/deployment.md`: removed Section 4 "Catalog worker (Phase 11)", updated
  Section 2 GitHub secrets, updated the overview table and post-deploy checklist
- **New migration** `supabase/migrations/20260711000000_remove_ai_catalog_static_data.sql`:
  1. Defensively deletes any AI-generated vendor/product/review rows the worker may have written
  2. Drops `region_id` columns + indexes from `vendors` and `products` (added in Phase 11 Slice A)
  3. Inserts the full static catalog idempotently (`on conflict (id) do nothing`): 6 categories,
     4 vendors, 30 products, 7 reviews (with fixed UUIDs f1..f7), 2 dev regions, product options
- **Slimmed** `supabase/seed.sql` to a comment explaining catalog data lives in the migration;
  prevents double-insert on `db:reset` (migrations run first, then seed)

## Checklist

- [x] `workers/catalog/` deleted
- [x] `.github/workflows/catalog.yml` deleted
- [x] `ANTHROPIC_API_KEY` removed from `.env.example`
- [x] `docs/deployment.md` updated (Section 2 + 4 rewritten, overview table, post-deploy checklist)
- [x] Migration created with defensive deletes, column drops, and idempotent static inserts
- [x] Reviews given fixed UUIDs (seed.sql omitted ids; migration provides f1..f7)
- [x] `supabase/seed.sql` reduced to comment only — no double-insert on `db:reset`
- [ ] Parent: `npm run db:reset` → `npm run db:types` → `npm run verify` (parent handles this)
- [ ] Parent: commit migration + regenerated `types/database.ts` together

## Approach: single static dataset

All environments (local dev, CI, prod) now share the same 30-product catalog via migration.
No AI generation, no per-region branching, no Anthropic API key. The `catalog_generated`
column on `regions` remains (baseline schema, not dropped) but is inert — it was set to
`true` in the static insert and has no runtime behavior without the worker.
