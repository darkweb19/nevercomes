-- seed.sql — local-dev sample catalog (Phase 2).
-- All vendors/products/reviews are ORIGINAL & FICTIONAL — no real brands (HARD RULE 7).
-- Public catalog + geo cache only; user-scoped rows are created at runtime in later phases.
-- Deterministic UUIDs so re-seeds and FKs are stable across db:reset.

begin;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into categories (id, name, slug) values
  ('00000000-0000-0000-0000-0000000000c1', 'Late-Night Eats',   'late-night-eats'),
  ('00000000-0000-0000-0000-0000000000c2', 'Gadgets',           'gadgets'),
  ('00000000-0000-0000-0000-0000000000c3', 'Home & Comfort',    'home-comfort'),
  ('00000000-0000-0000-0000-0000000000c4', 'Apparel',           'apparel'),
  ('00000000-0000-0000-0000-0000000000c5', 'Groceries',         'groceries'),
  ('00000000-0000-0000-0000-0000000000c6', 'Curiosities',       'curiosities');

-- ---------------------------------------------------------------------------
-- Vendors (fictional)
-- ---------------------------------------------------------------------------
insert into vendors (id, name, kind, rating, hero_image, locale) values
  ('00000000-0000-0000-0000-0000000000a1', 'Perpetual Provisions', 'store',      4.6, null, 'en-CA'),
  ('00000000-0000-0000-0000-0000000000a2', 'The Midnight Pantry',  'restaurant', 4.8, null, 'en-CA'),
  ('00000000-0000-0000-0000-0000000000a3', 'Driftwood Goods',      'store',      4.3, null, 'en-CA'),
  ('00000000-0000-0000-0000-0000000000a4', 'Almost Foods Co.',     'restaurant', 4.5, null, 'en-CA');

-- ---------------------------------------------------------------------------
-- Products (~30) — price_cents are integer cents (HARD RULE: no floats)
-- ---------------------------------------------------------------------------
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
  -- A few more across vendors to clear 30
  ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'Indefinite Power Bank',  '20,000mAh. Outlasts every ETA.',                               4299, 'CAD', 4.4, false),
  ('00000000-0000-0000-0000-0000000000eb', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'Endless Dumplings',      'Eight pan-fried, perpetually steaming somewhere.',             1199, 'CAD', 4.7, false),
  ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000c5', 'Tomorrow Tomatoes',      'Vine-ripened, arriving never.',                                649,  'CAD', 4.1, false),
  ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c3', 'Calm Throw Blanket',     'Chunky knit for the long wait.',                               5499, 'CAD', 4.8, false),
  ('00000000-0000-0000-0000-0000000000ee', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c6', 'Jar of Almost',          'Net weight: a feeling.',                                        999,  'CAD', 4.5, false);

-- ---------------------------------------------------------------------------
-- Reviews (a handful, fictional authors)
-- ---------------------------------------------------------------------------
insert into reviews (product_id, author, rating, body, ai_generated) values
  ('00000000-0000-0000-0000-0000000000d2', 'orderingForever',  5.0, 'Still tracking it. Five stars for the anticipation.',        false),
  ('00000000-0000-0000-0000-0000000000d2', 'porchwatcher',     4.5, 'Looks incredible in the photo. That is all I have.',          false),
  ('00000000-0000-0000-0000-0000000000d3', 'noodle_pilgrim',   5.0, 'The broth of my dreams, somewhere on a bicycle.',             false),
  ('00000000-0000-0000-0000-0000000000db', 'quiet_commuter',   4.0, 'Great sound. The case is real, the earbuds are a rumor.',     false),
  ('00000000-0000-0000-0000-0000000000df', 'sleepy_in_3am',    5.0, 'Most comfortable thing I have never received.',               false),
  ('00000000-0000-0000-0000-0000000000e5', 'doorstep_dweller', 5.0, 'Cozy concept. Checking the porch hourly.',                    false),
  ('00000000-0000-0000-0000-0000000000e1', 'curious_cat',      3.5, 'Mystery intact. Box not included (yet).',                     false);

-- ---------------------------------------------------------------------------
-- Regions (1–2 dev regions for routing in later phases)
-- ---------------------------------------------------------------------------
insert into regions (id, postal_prefix, centroid_lat, centroid_lng, city_centroid_lat, city_centroid_lng, catalog_generated, places_fetched) values
  ('00000000-0000-0000-0000-0000000000f1', 'M5V', 43.6426, -79.3871, 43.6532, -79.3832, true, false),
  ('00000000-0000-0000-0000-0000000000f2', 'V6B', 49.2797, -123.1207, 49.2827, -123.1207, true, false);

commit;
