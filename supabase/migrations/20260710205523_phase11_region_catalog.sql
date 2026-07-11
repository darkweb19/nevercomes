-- Phase 11: region-scoped catalog.
-- The offline catalog worker (workers/catalog) generates per-region vendors/products/reviews
-- and writes them with the service_role key. region_id NULL = the global floor: the seeded
-- catalog stays region-less and serves every region underneath the generated rows.
--
-- RLS: vendors/products already have RLS enabled with public-read select policies and no
-- write policies — that stays correct. The worker bypasses RLS via service_role; the API
-- never writes catalog rows.

alter table vendors
  add column region_id uuid references regions (id) on delete cascade;

alter table products
  add column region_id uuid references regions (id) on delete cascade;

create index vendors_region_id_idx on vendors (region_id);
create index products_region_id_idx on products (region_id);
