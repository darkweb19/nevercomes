-- Phase 12: AI catalog generation removed; static catalog is now the single dataset
-- for all environments. The Python/LangGraph catalog worker (workers/catalog/) and its
-- GitHub Actions cron (catalog.yml) have been deleted. Catalog data that was previously
-- generated per-region by Claude Haiku now ships here as a deterministic, idempotent
-- data migration so prod and local always have the same catalog.
--
-- This migration:
--   1. Defensively removes any AI-generated rows the worker may have written to prod.
--   2. Drops the region_id columns added by 20260710205523_phase11_region_catalog.sql
--      (those indexes and columns are no longer needed; the schema stays append-only).
--   3. Inserts the full static catalog idempotently (on conflict do nothing).
--   4. Does NOT touch RLS — existing public-read policies on all catalog tables remain.

begin;

-- ---------------------------------------------------------------------------
-- 1. Remove AI-generated catalog rows (safe to re-run; cascades handle FKs)
--    order_items.product_id is ON DELETE SET NULL so open orders are unaffected.
-- ---------------------------------------------------------------------------
delete from vendors where region_id is not null;

delete from products where ai_generated = true;

delete from reviews where ai_generated = true;

-- ---------------------------------------------------------------------------
-- 2. Drop Phase 11 region_id indexes and columns
-- ---------------------------------------------------------------------------
drop index if exists vendors_region_id_idx;
drop index if exists products_region_id_idx;

alter table vendors  drop column if exists region_id;
alter table products drop column if exists region_id;

-- ---------------------------------------------------------------------------
-- 3. Static catalog — idempotent inserts (on conflict do nothing)
-- ---------------------------------------------------------------------------

-- Categories
insert into categories (id, name, slug) values
  ('00000000-0000-0000-0000-0000000000c1', 'Late-Night Eats',   'late-night-eats'),
  ('00000000-0000-0000-0000-0000000000c2', 'Gadgets',           'gadgets'),
  ('00000000-0000-0000-0000-0000000000c3', 'Home & Comfort',    'home-comfort'),
  ('00000000-0000-0000-0000-0000000000c4', 'Apparel',           'apparel'),
  ('00000000-0000-0000-0000-0000000000c5', 'Groceries',         'groceries'),
  ('00000000-0000-0000-0000-0000000000c6', 'Curiosities',       'curiosities')
on conflict (id) do nothing;

-- Vendors (fictional — no real-brand names, HARD RULE 7)
insert into vendors (id, name, kind, rating, hero_image, locale) values
  ('00000000-0000-0000-0000-0000000000a1', 'Perpetual Provisions', 'store',      4.6, null, 'en-CA'),
  ('00000000-0000-0000-0000-0000000000a2', 'The Midnight Pantry',  'restaurant', 4.8, null, 'en-CA'),
  ('00000000-0000-0000-0000-0000000000a3', 'Driftwood Goods',      'store',      4.3, null, 'en-CA'),
  ('00000000-0000-0000-0000-0000000000a4', 'Almost Foods Co.',     'restaurant', 4.5, null, 'en-CA')
on conflict (id) do nothing;

-- Products (~30) — price_cents are integer cents (HARD RULE: no floats)
insert into products (id, vendor_id, category_id, name, description, price_cents, currency, rating, ai_generated) values
  -- The Midnight Pantry (restaurant) — Late-Night Eats
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'Forever Fries',          'Hand-cut, double-fried, eternally en route.',                  599,  'CAD', 4.7, false),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'The Unarriving Burger',  'A stacked classic that is always almost here.',                1299, 'CAD', 4.9, false),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'Limbo Ramen',            'Rich tonkotsu broth, suspended indefinitely.',                 1450, 'CAD', 4.8, false),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'Phantom Pho',            'Star anise and patience.',                                     1375, 'CAD', 4.6, false),
  ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'Pending Pad Thai',       'Tamarind-bright, perpetually plated elsewhere.',               1325, 'CAD', 4.5, false),
  ('00000000-0000-0000-0000-0000000000d6', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'In-Transit Tacos',       'Three soft tacos, route undisclosed.',                         1099, 'CAD', 4.4, false),
  -- Almost Foods Co. (restaurant) — Late-Night Eats / Groceries
  ('00000000-0000-0000-0000-0000000000d7', '00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000c1', 'Schrödinger Sushi',      'Both delivered and not, until you open the app.',              1699, 'CAD', 4.7, false),
  ('00000000-0000-0000-0000-0000000000d8', '00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000c1', 'Eventual Edamame',       'Steamed, salted, somewhere out there.',                        549,  'CAD', 4.2, false),
  ('00000000-0000-0000-0000-0000000000d9', '00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000c5', 'Suspended Sourdough',    'A loaf with excellent crust and poor punctuality.',            799,  'CAD', 4.6, false),
  ('00000000-0000-0000-0000-0000000000da', '00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000c5', 'Almost Almonds',         'Roasted, salted, theoretically yours.',                        899,  'CAD', 4.3, false),
  -- Perpetual Provisions (store) — Gadgets / Home / Curiosities
  ('00000000-0000-0000-0000-0000000000db', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'Anywhere Earbuds',       'Noise-cancelling. Delivery-cancelling.',                       7999, 'CAD', 4.4, false),
  ('00000000-0000-0000-0000-0000000000dc', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'The Forever Charger',    '100W. Charges everything except your hopes.',                  3499, 'CAD', 4.1, false),
  ('00000000-0000-0000-0000-0000000000dd', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'Halcyon Headphones',     'Over-ear calm for the endlessly waiting.',                     14999,'CAD', 4.6, false),
  ('00000000-0000-0000-0000-0000000000de', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'Standby Smartwatch',     'Tracks your steps and your unmet expectations.',               19999,'CAD', 4.2, false),
  ('00000000-0000-0000-0000-0000000000df', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c3', 'Patience Pillow',        'Memory foam that remembers every delay.',                      4599, 'CAD', 4.7, false),
  ('00000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c3', 'The Waiting Lamp',       'Warm 2700K glow for long, hopeful evenings.',                  5899, 'CAD', 4.5, false),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c6', 'Mystery Box (Sealed)',   'Contents unknown. Arrival unknowable.',                        2999, 'CAD', 4.0, false),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c6', 'Pocket Hourglass',       'For measuring estimated delivery times.',                      1899, 'CAD', 4.3, false),
  -- Driftwood Goods (store) — Home / Apparel / Curiosities
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c3', 'Driftwood Mug',          'Handmade stoneware. Holds coffee and anticipation.',           2400, 'CAD', 4.6, false),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c3', 'Slow Ceramics Bowl',     'Glazed by hand, shipped by no one.',                           3200, 'CAD', 4.4, false),
  ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c4', 'The Eternal Hoodie',     'Heavyweight fleece for indefinite porch-checking.',            6499, 'CAD', 4.8, false),
  ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c4', 'Layover Socks (3-pack)', 'Cushioned crew socks for standing by the door.',               1799, 'CAD', 4.5, false),
  ('00000000-0000-0000-0000-0000000000e7', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c4', 'Holding-Pattern Tee',    'Soft combed cotton. Ships in spirit only.',                    2999, 'CAD', 4.3, false),
  ('00000000-0000-0000-0000-0000000000e8', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c6', 'Tiny Brass Compass',     'Points roughly toward your order. Roughly.',                   2299, 'CAD', 4.2, false),
  ('00000000-0000-0000-0000-0000000000e9', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c3', 'Threshold Doormat',      'Reads WELCOME (eventually).',                                  2799, 'CAD', 4.6, false),
  -- A few more across vendors to reach 30
  ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'Indefinite Power Bank',  '20,000mAh. Outlasts every ETA.',                               4299, 'CAD', 4.4, false),
  ('00000000-0000-0000-0000-0000000000eb', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'Endless Dumplings',      'Eight pan-fried, perpetually steaming somewhere.',             1199, 'CAD', 4.7, false),
  ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000c5', 'Tomorrow Tomatoes',      'Vine-ripened, arriving never.',                                649,  'CAD', 4.1, false),
  ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c3', 'Calm Throw Blanket',     'Chunky knit for the long wait.',                               5499, 'CAD', 4.8, false),
  ('00000000-0000-0000-0000-0000000000ee', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c6', 'Jar of Almost',          'Net weight: a feeling.',                                        999,  'CAD', 4.5, false)
on conflict (id) do nothing;

-- Reviews — fixed UUIDs assigned here (seed.sql omitted ids; reviews table uses uuid pk)
-- f1..f7 assigned in order matching seed.sql
insert into reviews (id, product_id, author, rating, body, ai_generated) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000d2', 'orderingForever',  5.0, 'Still tracking it. Five stars for the anticipation.',        false),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000d2', 'porchwatcher',     4.5, 'Looks incredible in the photo. That is all I have.',          false),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000d3', 'noodle_pilgrim',   5.0, 'The broth of my dreams, somewhere on a bicycle.',             false),
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000db', 'quiet_commuter',   4.0, 'Great sound. The case is real, the earbuds are a rumor.',     false),
  ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-0000000000df', 'sleepy_in_3am',    5.0, 'Most comfortable thing I have never received.',               false),
  ('00000000-0000-0000-0000-0000000000f6', '00000000-0000-0000-0000-0000000000e5', 'doorstep_dweller', 5.0, 'Cozy concept. Checking the porch hourly.',                    false),
  ('00000000-0000-0000-0000-0000000000f7', '00000000-0000-0000-0000-0000000000e1', 'curious_cat',      3.5, 'Mystery intact. Box not included (yet).',                     false)
on conflict (id) do nothing;

-- Regions (2 dev regions)
insert into regions (id, postal_prefix, centroid_lat, centroid_lng, city_centroid_lat, city_centroid_lng, catalog_generated, places_fetched) values
  ('00000000-0000-0000-0000-0000000000f1', 'M5V', 43.6426, -79.3871, 43.6532, -79.3832, true, false),
  ('00000000-0000-0000-0000-0000000000f2', 'V6B', 49.2797, -123.1207, 49.2827, -123.1207, true, false)
-- postal_prefix is the natural key (unique); a pre-existing row under another id must not abort the migration
on conflict (postal_prefix) do nothing;

-- Product options (idempotent — UPDATE only touches specific rows by fixed UUID)
update products set options = '[
  {"name":"Doneness","kind":"single","choices":[{"label":"Rare","note":"You will wait either way"},{"label":"Medium"},{"label":"Well done"}]},
  {"name":"Add-ons","kind":"multi","choices":[{"label":"Extra patty","note":"+$0.00"},{"label":"Smoked cheddar","note":"+$0.00"},{"label":"Maple bacon","note":"+$0.00"},{"label":"Anticipation","note":"Sold out"}]}
]'::jsonb where id = '00000000-0000-0000-0000-0000000000d2';

update products set options = '[
  {"name":"Broth","kind":"single","choices":[{"label":"Tonkotsu"},{"label":"Miso"},{"label":"Shoyu"}]},
  {"name":"Spice","kind":"single","choices":[{"label":"Mild"},{"label":"Medium"},{"label":"Volcanic","note":"Still won''t arrive"}]},
  {"name":"Add-ons","kind":"multi","choices":[{"label":"Soft egg","note":"+$0.00"},{"label":"Extra chashu","note":"+$0.00"},{"label":"Sweet corn","note":"+$0.00"}]}
]'::jsonb where id = '00000000-0000-0000-0000-0000000000d3';

update products set options = '[
  {"name":"Size","kind":"single","choices":[{"label":"S"},{"label":"M"},{"label":"L"},{"label":"XL"}]},
  {"name":"Color","kind":"single","choices":[{"label":"Carbon"},{"label":"Oat"},{"label":"Stamp Red"}]}
]'::jsonb where id = '00000000-0000-0000-0000-0000000000e5';

update products set options = '[
  {"name":"Color","kind":"single","choices":[{"label":"Carbon"},{"label":"Bone"}]},
  {"name":"Add-ons","kind":"multi","choices":[{"label":"Extended never-warranty","note":"+$0.00"}]}
]'::jsonb where id = '00000000-0000-0000-0000-0000000000dd';

commit;
