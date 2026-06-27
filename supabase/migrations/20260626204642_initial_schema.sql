-- Phase 2 — initial schema (baseline)
-- Authoritative model: architecture.md §7 + spec.md §10/§13 deltas.
-- Rules: migration-first, no ORM; RLS ships in THIS migration with its tables;
-- money is integer *_cents + currency (never floats).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type vendor_kind as enum ('store', 'restaurant');
create type order_status as enum ('accepted', 'preparing', 'picked_up', 'nearby', 'never');

-- ---------------------------------------------------------------------------
-- Public catalog (public-read; written only by migrations/seed or the offline worker)
-- ---------------------------------------------------------------------------
create table vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        vendor_kind not null,
  rating      numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  hero_image  text,
  locale      text not null default 'en-CA',
  created_at  timestamptz not null default now()
);

create table categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  slug  text not null unique
);

create table products (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references vendors (id) on delete cascade,
  category_id  uuid references categories (id) on delete set null,
  name         text not null,
  description  text,
  price_cents  integer not null check (price_cents >= 0),
  currency     text not null default 'CAD',
  rating       numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  image_url    text,
  options      jsonb not null default '[]'::jsonb,
  ai_generated boolean not null default false,
  created_at   timestamptz not null default now()
);
create index products_vendor_id_idx on products (vendor_id);
create index products_category_id_idx on products (category_id);

create table reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products (id) on delete cascade,
  author       text not null,
  rating       numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  body         text,
  ai_generated boolean not null default false,
  created_at   timestamptz not null default now()
);
create index reviews_product_id_idx on reviews (product_id);

-- ---------------------------------------------------------------------------
-- Geo cache (public-read; populated once per region by later phases)
-- ---------------------------------------------------------------------------
create table regions (
  id                 uuid primary key default gen_random_uuid(),
  postal_prefix      text not null unique,
  centroid_lat       double precision,
  centroid_lng       double precision,
  city_centroid_lat  double precision,
  city_centroid_lng  double precision,
  catalog_generated  boolean not null default false,
  places_fetched     boolean not null default false,
  created_at         timestamptz not null default now()
);

create table osm_places (
  id         uuid primary key default gen_random_uuid(),
  region_id  uuid not null references regions (id) on delete cascade,
  name       text not null,
  lat        double precision not null,
  lng        double precision not null,
  kind       text,
  source     text not null default 'osm',
  fetched_at timestamptz not null default now()
);
create index osm_places_region_id_idx on osm_places (region_id);

-- ---------------------------------------------------------------------------
-- Owner-scoped (RLS on auth.uid()); anonymous-first identity
-- ---------------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  handle       text,
  is_anonymous boolean not null default true,
  created_at   timestamptz not null default now()
);

-- orders is append-only: insert + select for the owner, no update/delete policy.
create table orders (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles (id) on delete cascade,
  address          jsonb,
  postal_code      text,
  region_id        uuid references regions (id) on delete set null,
  origin_lat       double precision,
  origin_lng       double precision,
  origin_place_id  uuid references osm_places (id) on delete set null,
  dest_lat         double precision,
  dest_lng         double precision,
  route_polyline   jsonb,
  route_source     text check (route_source in ('osrm', 'synthetic')),
  status           order_status not null default 'accepted',
  fake_total_cents integer not null default 0 check (fake_total_cents >= 0),
  currency         text not null default 'CAD',
  created_at       timestamptz not null default now() -- source of truth for the 2-min cap
);
create index orders_profile_id_idx on orders (profile_id);

create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders (id) on delete cascade,
  product_id      uuid references products (id) on delete set null,
  qty             integer not null check (qty > 0),
  options         jsonb not null default '{}'::jsonb,
  line_total_cents integer not null check (line_total_cents >= 0)
);
create index order_items_order_id_idx on order_items (order_id);

create table user_stats (
  profile_id       uuid primary key references profiles (id) on delete cascade,
  fake_spent_cents integer not null default 0 check (fake_spent_cents >= 0),
  orders_count     integer not null default 0 check (orders_count >= 0),
  streak_days      integer not null default 0 check (streak_days >= 0),
  achievements     jsonb not null default '[]'::jsonb
);

create table events (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete cascade,
  session_id text,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  ts         timestamptz not null default now()
);
create index events_profile_id_idx on events (profile_id);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

-- Public-read catalog + geo cache: anyone may read, nobody writes via the API.
alter table vendors enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table reviews enable row level security;
alter table regions enable row level security;
alter table osm_places enable row level security;

create policy "vendors are public read" on vendors for select using (true);
create policy "categories are public read" on categories for select using (true);
create policy "products are public read" on products for select using (true);
create policy "reviews are public read" on reviews for select using (true);
create policy "regions are public read" on regions for select using (true);
create policy "osm_places are public read" on osm_places for select using (true);

-- profiles: owner can read/create/update their own row.
alter table profiles enable row level security;
create policy "profiles select own" on profiles
  for select using (id = (select auth.uid()));
create policy "profiles insert own" on profiles
  for insert with check (id = (select auth.uid()));
create policy "profiles update own" on profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- orders: owner can read + create; APPEND-ONLY (no update/delete policy).
alter table orders enable row level security;
create policy "orders select own" on orders
  for select using (profile_id = (select auth.uid()));
create policy "orders insert own" on orders
  for insert with check (profile_id = (select auth.uid()));

-- order_items: scoped through the parent order's ownership.
alter table order_items enable row level security;
create policy "order_items select via order" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and o.profile_id = (select auth.uid())
    )
  );
create policy "order_items insert via order" on order_items
  for insert with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and o.profile_id = (select auth.uid())
    )
  );

-- user_stats: owner read/create/update.
alter table user_stats enable row level security;
create policy "user_stats select own" on user_stats
  for select using (profile_id = (select auth.uid()));
create policy "user_stats insert own" on user_stats
  for insert with check (profile_id = (select auth.uid()));
create policy "user_stats update own" on user_stats
  for update using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- events: owner read + insert (most analytics go straight to PostHog; a few mirror here).
alter table events enable row level security;
create policy "events select own" on events
  for select using (profile_id = (select auth.uid()));
create policy "events insert own" on events
  for insert with check (profile_id = (select auth.uid()));
