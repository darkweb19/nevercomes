-- Phase 5 — checkout/order: anonymous-first identity + atomic append-only order write.
--
-- Two things ship here together:
--   1. handle_new_user(): auto-create the owner-scoped `profiles` row whenever an
--      auth.users row appears (incl. anonymous sign-ins). Without this the core loop
--      can't create an order anonymously (orders.profile_id -> profiles -> auth.users).
--   2. create_order(): one-transaction insert of the `orders` row + its `order_items`,
--      so a failed items insert never leaves an orphaned order. SECURITY INVOKER, so the
--      existing append-only RLS policies on both tables remain the guard.
--
-- Anonymous sign-ins are enabled in supabase/config.toml (local). PROD is an out-of-band
-- auth setting (Supabase dashboard / Management API) — NOT captured by this migration.

-- ===========================================================================
-- 1. Profiles auto-provisioning on new auth user (anon or permanent)
-- ===========================================================================

-- SECURITY DEFINER: runs as the function owner so it can insert into public.profiles
-- (which has owner-scoped RLS) from the auth.users insert context. Pinned search_path.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, is_anonymous)
  values (new.id, coalesce(new.is_anonymous, false))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- 2. Atomic, append-only order write
-- ===========================================================================

-- p_items: a JSON array of { product_id (uuid|null), qty (int>0), options (jsonb),
-- line_total_cents (int>=0) }. SECURITY INVOKER: the caller's role executes the inserts,
-- so the "orders insert own" / "order_items insert via order" RLS policies still apply
-- (profile_id is forced to auth.uid() here). The whole function body is one transaction.
create function public.create_order(
  p_postal            text,
  p_region_id         uuid,
  p_dest_lat          double precision,
  p_dest_lng          double precision,
  p_fake_total_cents  integer,
  p_items             jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_order_id uuid;
begin
  if v_uid is null then
    raise exception 'create_order: no authenticated session' using errcode = '28000';
  end if;

  insert into public.orders (
    profile_id, postal_code, region_id, dest_lat, dest_lng,
    route_source, status, fake_total_cents, currency
  ) values (
    v_uid, p_postal, p_region_id, p_dest_lat, p_dest_lng,
    'synthetic', 'accepted', coalesce(p_fake_total_cents, 0), 'CAD'
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, qty, options, line_total_cents)
  select
    v_order_id,
    nullif(item->>'product_id', '')::uuid,
    (item->>'qty')::integer,
    coalesce(item->'options', '{}'::jsonb),
    (item->>'line_total_cents')::integer
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;

  return v_order_id;
end;
$$;

grant execute on function public.create_order(
  text, uuid, double precision, double precision, integer, jsonb
) to anon, authenticated;
