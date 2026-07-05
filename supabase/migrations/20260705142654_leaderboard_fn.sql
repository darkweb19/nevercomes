-- Phase 10 (leaderboard): public, anonymized leaderboard aggregates.
--
-- orders is owner-scoped by RLS, so cross-user rankings need a SECURITY DEFINER
-- function. It exposes ONLY aggregates keyed by a short hash of profile_id —
-- raw profile UUIDs never leave the database. The caller's own row is resolved
-- inside the function via auth.uid(), so no id has to round-trip the client.
--
-- Shape (jsonb):
--   rows   — top 10 by saved cents: { seed, savedCents, orders, oldestOrderAt, rank }
--   you    — same shape for the caller, or null (signed out / no orders)
--   totals — { neverDelivered, savedCentsAll } (every order is never-delivered; the product)

create or replace function public.leaderboard()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with per_profile as (
  select
    profile_id,
    sum(fake_total_cents)::bigint as saved_cents,
    count(*)::int                 as order_count,
    min(created_at)               as oldest_order_at
  from public.orders
  group by profile_id
),
ranked as (
  select
    per_profile.*,
    rank() over (order by saved_cents desc, oldest_order_at asc)::int as rank
  from per_profile
),
top_rows as (
  select * from ranked order by rank asc, oldest_order_at asc limit 10
)
select jsonb_build_object(
  'rows',
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'seed', substr(md5(profile_id::text), 1, 12),
          'savedCents', saved_cents,
          'orders', order_count,
          'oldestOrderAt', oldest_order_at,
          'rank', rank
        )
        order by rank asc, oldest_order_at asc
      )
      from top_rows
    ),
    '[]'::jsonb
  ),
  'you',
  (
    select jsonb_build_object(
      'seed', substr(md5(profile_id::text), 1, 12),
      'savedCents', saved_cents,
      'orders', order_count,
      'oldestOrderAt', oldest_order_at,
      'rank', rank
    )
    from ranked
    where profile_id = auth.uid()
  ),
  'totals',
  jsonb_build_object(
    'neverDelivered', (select count(*) from public.orders),
    'savedCentsAll', coalesce((select sum(fake_total_cents) from public.orders), 0)
  )
);
$$;

revoke all on function public.leaderboard() from public;
grant execute on function public.leaderboard() to anon, authenticated;
