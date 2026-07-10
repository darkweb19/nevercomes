# Phase 11 — AI catalog (Python + LangGraph worker)  [APPROVED 2026-07-10]

Spec §6: catalog generated **per region, once, offline**, cached in Postgres forever — the
request path never calls an LLM. This phase ships the schema deltas, the offline worker, and
the trigger/pre-seed infra. Slice D (browse integration) is **deferred** — design-gated.

## Decisions (Sujan, 2026-07-10)
- Worker model: **Claude Haiku 4.5** (`claude-haiku-4-5`, $1/$5 per MTok — est. < $0.50/region)
- Pre-seed: **Toronto/GTA FSAs only**
- Trigger: **GitHub Actions** (schedule ~15 min + `workflow_dispatch`)
- Slice D deferred until the Claude Design screen exists

## Verified against repo
- `regions.catalog_generated`, `products.ai_generated`, `vendors.ai_generated` exist already
- `products` / `vendors` have **no `region_id`** → Slice A migration
- Catalog tables are RLS public-read, no write policies → worker writes via `service_role`
- No `workers/` or Python code yet; `.env.example` lacks `ANTHROPIC_API_KEY`
- `/browse` is region-blind (stays that way until Slice D)

---

## Slice A — migration: region-scoped catalog (commit 1)
- [ ] New migration `supabase/migrations/<ts>_phase11_region_catalog.sql`:
      nullable `region_id uuid references regions(id) on delete cascade` on `vendors` + `products`
      (`NULL` = global floor: seeded products serve every region under generated rows)
- [ ] Indexes `vendors_region_id_idx`, `products_region_id_idx`
- [ ] RLS unchanged — note in migration comment why (public-read only; worker uses service_role)
- [ ] `npm run db:reset` → `npm run db:types` → `npm run verify` green
- [ ] Commit migration + regenerated `types/database.ts` together

## Slice B — worker `workers/catalog/` (commit 2)
- [ ] Python 3.12 project: `langgraph`, `anthropic`, `supabase`, `pydantic`; model `claude-haiku-4-5`
      with structured outputs (`client.messages.parse()`); no `effort` param (unsupported on Haiku)
- [ ] LangGraph pipeline: region_brief → vendors (5–8 fictional) → products (~40, integer
      `price_cents`, `options` jsonb) → reviews (deadpan) → validate (pydantic + real-brand
      blocklist; retry once then fail) → upsert (service_role; set `catalog_generated`;
      `events` row `catalog_generated` w/ counts, model, usage, seed)
- [ ] Idempotency: skip `catalog_generated = true` regions unless `--force`
- [ ] CLI: `python -m catalog.run --postal-prefix M5V` | `--all-pending [--max-regions N]` | `--force`
- [ ] Env: `workers/catalog/.env.example` (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
      ANTHROPIC_API_KEY); add ANTHROPIC_API_KEY note to root `.env.example` (never NEXT_PUBLIC_)
- [ ] pytest: validators, blocklist, price bounds, idempotency guard (mocked DB/LLM, no live calls)

## Slice C — trigger + pre-seed (commit 3)
- [ ] `.github/workflows/catalog.yml`: cron ~15 min → `--all-pending --max-regions 5`;
      `workflow_dispatch(postal_prefix, force)`; `concurrency` group; secrets in GH
- [ ] `workers/catalog/preseed.py`: upsert GTA region rows from static FSA→centroid table
      (M5V, M5G, M4Y, M6J, M5A, M4C, M2N, M9V, L5B, L4C), then generate pending
- [ ] `workers/catalog/README.md`: setup, local run against `npm run db:start`, secrets, cost

## Out of scope (deferred)
- Slice D — region-scoped `/browse` + "preparing your store…" state (design-gated)
- Product imagery / CDN; OSRM / Overpass

## Verification
- [ ] A: `db:reset` clean rebuild; `verify` green; `db:types:check` passes
- [ ] B: pytest green; live local run for M5V → rows w/ `ai_generated=true` + `region_id` set,
      `catalog_generated` flipped, `events` row; re-run no-op; `--force` regenerates
- [ ] C: workflow reviewed/dry-run; preseed run against local DB
- [ ] Phase end: `npm run verify` + one `npm run test:e2e` sanity pass
