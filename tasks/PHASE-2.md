# PHASE 2 — Data layer (migrations + seed + typed clients)

Stand up the v1 data model **migration-first, no ORM**. Not design-gated.
**DoD:** local DB rebuilds from migrations; `types/database.ts` committed; a typed sample query works.

Authoritative model: `architecture.md §7` (base) + `spec.md §10/§13` deltas (`regions`,
`osm_places`, `orders` route/sim columns). Money is integer `*_cents` + `currency` (never floats).

> ⚠️ **ENV BLOCKER:** Docker is **not running** in this environment, so `db:reset`/`db:types`
> (which need the local Supabase stack) cannot run here, and `types/database.ts` (generated,
> never hand-edited — Rule 3) cannot be produced. **Pending the DB-provisioning decision below**
> before this phase can be verified/closed.

## Decision needed — how to provision the DB for migration + type generation
- **A (recommended):** You start Docker Desktop → I run `db:start` → `db:reset` → `db:types`
  locally. Matches the local-first rule exactly.
- **B:** Use a linked **dev** Supabase project (you provide ref/keys) → push migration there →
  `db:types:linked`. Never prod.
- **C:** I author migration + seed + clients + deps now and commit; **you/CI** run `db:reset` +
  `db:types` later when Docker is up. Phase 2 stays "code complete, unverified" until then.

## Tables (single baseline migration; RLS ships WITH the tables — Rule 5)

`supabase/migrations/<timestamp>_initial_schema.sql`

**Enums:** `vendor_kind ('store','restaurant')`, `order_status
('accepted','preparing','picked_up','nearby','never')`.

**Public-read** (anon select; no write): `vendors`, `categories`, `products`, `reviews`,
`regions`, `osm_places`.
**Owner-scoped** (RLS on `auth.uid()`): `profiles`, `orders`, `order_items`, `user_stats`, `events`.

| table | columns (per arch §7 / spec §10) |
|---|---|
| vendors | id, name, kind `vendor_kind`, rating, hero_image, locale, created_at |
| categories | id, name, slug (unique) |
| products | id, vendor_id→vendors, category_id→categories, name, description, price_cents int, currency, rating, image_url, options jsonb, ai_generated bool |
| reviews | id, product_id→products, author, rating, body, ai_generated bool |
| regions | id, postal_prefix, centroid_lat/lng, city_centroid_lat/lng, catalog_generated bool, places_fetched bool, created_at |
| osm_places | id, region_id→regions, name, lat, lng, kind, source default 'osm', fetched_at |
| profiles | id (= auth.uid, PK, FK auth.users), handle, is_anonymous bool, created_at |
| orders | id, profile_id→profiles, address jsonb, postal_code, region_id→regions, origin_lat/lng, origin_place_id, dest_lat/lng, route_polyline jsonb, route_source text, status `order_status`, fake_total_cents int, currency, created_at — **append-only** |
| order_items | id, order_id→orders, product_id→products, qty int, options jsonb, line_total_cents int |
| user_stats | profile_id→profiles (PK), fake_spent_cents int, orders_count int, streak_days int, achievements jsonb |
| events | id, profile_id→profiles, session_id, type, payload jsonb, ts |

**RLS policies (same migration):**
- Public-read tables: `enable RLS` + `select using (true)`.
- `profiles`: select/insert/update where `id = auth.uid()`.
- `orders`: select + insert where `profile_id = auth.uid()`; **no update/delete** (append-only).
- `order_items`: select/insert where parent order's `profile_id = auth.uid()` (subquery/exists).
- `user_stats`: select/insert/update where `profile_id = auth.uid()`.
- `events`: insert + select where `profile_id = auth.uid()`.

**Indexes:** products(vendor_id), products(category_id), reviews(product_id),
order_items(order_id), orders(profile_id), osm_places(region_id).

## Seed — `supabase/seed.sql`
~4 **fictional** vendors (original names only — Rule 7), ~6 categories, **~30 products** with
`price_cents`, a handful of `reviews`, and **1–2 dev `regions`**. No user-scoped rows (those are
created at runtime in later phases).

## Typed clients — `lib/supabase/`
- `client.ts` — browser client (anon key) via `@supabase/ssr` `createBrowserClient<Database>`.
- `server.ts` — server client (cookies) `createServerClient<Database>`; a separate server-only
  service-role helper (never imported client-side — Rule 6).
- Both typed with generated `Database` from `types/database.ts`.

## Deps
Add `@supabase/supabase-js` + `@supabase/ssr` (currently absent).

## Out of scope (guard creep)
- `handle_new_user` auth-provisioning trigger (auto-create profile/user_stats) → Phase 5/9 (auth).
- Any UI, catalog generation worker, OSRM/Overpass, route resolution → later phases.

## Verify (proves it done)
- `npm run db:reset` rebuilds local from the migration cleanly (golden test).
- `npm run db:types` → `types/database.ts` regenerated + committed; `npm run db:types:check` passes.
- A typed sample query compiles + returns (e.g. `select id,name,price_cents from products`).
- `npm run verify` green (typecheck now resolves the `Database` type).
- No e2e (core loop not wired yet).
- Branch `phase-2-data-layer`; small commits; PR into `main`, `Closes #2`.
