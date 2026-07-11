# Phase 11 — AI catalog (Python + LangGraph worker)  [APPROVED 2026-07-10]

Spec §6: catalog generated **per region, once, offline**, cached in Postgres forever — the
request path never calls an LLM. This phase ships the schema deltas, the offline worker, and
the trigger/pre-seed infra. Slice D (browse integration) shipped once its design was provided
(2026-07-11).

## Decisions (Sujan, 2026-07-10)
- Worker model: **Claude Haiku 4.5** (`claude-haiku-4-5`, $1/$5 per MTok — est. < $0.50/region)
- Pre-seed: **Toronto/GTA FSAs only**
- Trigger: **GitHub Actions** (schedule ~15 min + `workflow_dispatch`)
- Slice D deferred until the Claude Design screen exists

## Verified against repo
- `regions.catalog_generated`, `products.ai_generated`, `reviews.ai_generated` exist already
  (NOT vendors — generated vendors are identified by `region_id is not null`)
- `products` / `vendors` have **no `region_id`** → Slice A migration
- Catalog tables are RLS public-read, no write policies → worker writes via `service_role`
- No `workers/` or Python code yet; `.env.example` lacks `ANTHROPIC_API_KEY`
- `/browse` is region-blind (stays that way until Slice D)

---

## Slice A — migration: region-scoped catalog (commit 1) ✅ `b59d914`
- [x] New migration `supabase/migrations/20260710205523_phase11_region_catalog.sql`:
      nullable `region_id uuid references regions(id) on delete cascade` on `vendors` + `products`
      (`NULL` = global floor: seeded products serve every region under generated rows)
- [x] Indexes `vendors_region_id_idx`, `products_region_id_idx`
- [x] RLS unchanged — note in migration comment why (public-read only; worker uses service_role)
- [x] `npm run db:reset` → `npm run db:types` → `npm run verify` green (154 tests)
- [x] Commit migration + regenerated `types/database.ts` together

## Slice B — worker `workers/catalog/` (commit 2)
- [x] Python project: `langgraph`, `anthropic`, `supabase`, `pydantic>=2`; model `claude-haiku-4-5`
      with structured outputs (`output_config.format` json_schema + pydantic validation);
      no `effort` param (unsupported on Haiku)
- [x] LangGraph pipeline: region_brief → vendors (5–8 fictional) → products (~40, integer
      `price_cents`, `options` jsonb) → reviews (deadpan) → validate (pydantic + real-brand
      blocklist, word-boundary matching; retry once then abort) → upsert (service_role; set
      `catalog_generated`; `events` row `catalog_generated` w/ counts, model, temperature, usage)
- [x] Idempotency: skip `catalog_generated = true` regions unless `--force` (force deletes the
      region's vendors first; FK cascade clears products/reviews; global floor untouched)
- [x] CLI: `python -m catalog.run --postal-prefix M5V` | `--all-pending [--max-regions N]` | `--force`
- [x] Env: `workers/catalog/.env.example` (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
      ANTHROPIC_API_KEY); ANTHROPIC_API_KEY note added to root `.env.example` (never NEXT_PUBLIC_)
- [x] pytest: 95 tests — validators, blocklist, price bounds, idempotency guard (no network)

## Slice C — trigger + pre-seed (commit 3) ✅ `3aaf593`
- [x] `.github/workflows/catalog.yml`: cron 15 min → `--all-pending --max-regions 5`;
      `workflow_dispatch(postal_prefix, force, preseed)`; `concurrency` group; secrets in GH
      (SUPABASE_URL already exists from keep-alive; SERVICE_ROLE + ANTHROPIC_API_KEY are new)
- [x] `workers/catalog/catalog/preseed.py`: ensures GTA region rows from static FSA→centroid
      table (M5V, M5G, M4Y, M6J, M5A, M4C, M2N, M9V, L5B, L4C — never overwrites existing),
      then generates pending; +5 pytest tests (100 total)
- [x] `workers/catalog/README.md`: setup, local run against `npm run db:start`, secrets, cost

## Slice D — region-aware `/browse` cold-region states (commit 4) [design provided 2026-07-11]
Design: Claude Design "NeverComes cold region states" (`BrowseScreen.dc.html`, phase =
cold | filling | warm + reduced variant). Decisions (Sujan): default region **M5V** + `?region`
override; **read-only + poll** (no migration, no realtime, no write path — a cold visit does not
itself trigger generation).
- [x] Pure `lib/catalog/region.ts`: `resolveBrowseRegion` (M5V default + FSA validation),
      `phaseForRegion`, `catalogScope` — no React/Supabase. +12 unit tests (`region.test.ts`)
- [x] `lib/supabase/queries.ts`: `regionScope` on `getCatalogPage` (`{mode:"global"}` = floor,
      `{mode:"region"}` = `region_id is null OR = id`); new `getRegionByPrefix` + `getRegionVendors`
      (vendor + `products(count)` embed)
- [x] `app/browse/page.tsx`: ISR shell now fetches the **global floor** explicitly (region-independent)
- [x] Components (build to design, tokens only): `ReceiptPrinter` (light `paper-000`/`ink-900` stub,
      staggered `ncReceiptLine` + `ncCursorBlink`, honest redaction rows), `PreparingBanner`,
      `StoreReadyBanner`, `NearbyVendors` (ghosts → real cards), `RegionStatusPill`; `SiteHeader`
      gains an optional region pill
- [x] `CatalogBrowser`: resolves FSA via `useSyncExternalStore` (hydration-safe, keeps page static),
      polls a cold region (12s, visibility-aware) → cold→filling→warm; threads `regionScope` into
      filter-refetch + load-more; filling confirmation dwells `FILL_DWELL_MS` then leaves
- [x] Keyframes `ncSettle` + `ncGhost` added to `globals.css` (reused `ncReceiptLine`/`ncCursorBlink`/
      `ncFadeIn`/`ncPulse`); `perf` border color added to Tailwind theme
- [x] Reduced motion: inherits the global `prefers-reduced-motion` collapse (static receipt, no
      ghost pulse, instant settle) — same convention as `ProcessingStep`

## Out of scope (deferred)
- Real geo/IP region detection (Phase 12 localize); cold-visit generation trigger + realtime fill
- Product imagery / CDN; OSRM / Overpass

## Verification
- [x] A: `db:reset` clean rebuild; `verify` green (154 unit)
- [x] B: pytest green (108 tests); **live local run for M5V (`--force`) verified**: generated
      7 vendors / 49 products / 51 reviews, all `region_id`=M5V + `ai_generated=true`;
      global floor untouched (4 vendors / 30 products still NULL-region); **0 orphan reviews**
      (alignment fix confirmed on real data); `catalog_generated` flipped; `events` audit row
      with counts + usage (3,577 in / 7,349 out ≈ $0.04); no brand leaks; re-run without
      `--force` skips (0 tokens, no duplication)
- [x] C: workflow reviewed; preseed logic tested (live GTA fill left for the pre-seed dispatch)
- [x] Phase end: `npm run verify` green + `npm run test:e2e` 8/8 green
- [x] D: `verify` green (typecheck + lint + 163 unit incl. 12 region tests); e2e 8/8 green
      (browse is the core-loop entry — cold state exercised in-browser); cold SSR confirmed
      (banner + PREPARING pill + 3 ghosts + 12 global-floor products); global-floor count = 30
- [x] DoD code-review on `main...HEAD` — verdict "fix first"; both blockers fixed in `299ee5d`
      (position-aligned product ids w/ None gaps; id mappings from client-built rows, never
      response order; validate node now bounds-checks indexes) + nits applied (env-block force
      flag, pinned requirements, public insert_region, redundant cap removed); 108 pytest tests
