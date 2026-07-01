# PHASE 5 — Fake checkout + order  [design-gated]

Build the checkout to the imported Claude Design (`NeverComes checkout flow` → `Checkout.dc.html`).
A single four-step flow — **location → payment → processing → done** — on the carbon/paper system,
all totals **$0.00**, ghost would-be amounts struck through. On "Place order" the server writes an
**append-only** `orders` (+ `order_items`) row and routes to `/track/[orderId]`.

**DoD (execution-phases §Phase 5):** full loop works with **no account**; order row created;
routes to the tracker. Plus repo invariants: migration-first, RLS in same migration, `types/database.ts`
regenerated, `lib/sim` untouched, no `service_role` key in client, no real brands, `npm run verify` green.

---

## The central decision: anonymous identity for an owner-scoped order

`orders.profile_id` is **NOT NULL** → `profiles.id` → `auth.users.id`, and `orders insert own`
RLS requires `profile_id = auth.uid()`. So an order legally needs an auth identity. The spec
(§Auth, line 122) is explicit: **Supabase anonymous auth** issues a session on first visit and
order history attaches to it. That is the path (not service-role bypass).

Two gaps to close, both Phase-5 work:
1. `enable_anonymous_sign_ins = false` in `supabase/config.toml` → flip to `true` (committed).
   **⚠️ Prod is an out-of-band auth setting** (Supabase dashboard / Management API), NOT a SQL
   migration — flag as a deploy step for Sujan.
2. No trigger creates a `profiles` row when an `auth.users` row appears → add a
   `handle_new_user` trigger (migration).

## Proposed decisions (confirm before build)
- **D1 — Identity:** Supabase **anonymous sign-in**. Client calls `signInAnonymously()` if no
  session (the `@supabase/ssr` browser client persists it to cookies); the API route's cookie-bound
  server client then satisfies RLS as that uid. Keep RLS as the guard — **no service-role for the
  happy path.**
- **D2 — Atomic write via RPC:** a `create_order(...)` Postgres function (**SECURITY INVOKER**, so
  RLS still applies) inserts the `orders` row + all `order_items` in one transaction and returns the
  new id. Avoids an orphaned order if the items insert fails. Route makes one `.rpc()` call.
- **D3 — Resolution depth (minimal now):** look up `regions` by `postal_prefix`; use its centroid as
  `dest_lat/lng`, `region_id`, `route_source = 'synthetic'`, `route_polyline = null`, origin left
  null. **No OSRM / osm_places / Overpass** (infra doesn't exist; spec says Overpass is a background
  job). Real road routing is Phase 7's concern. Order is still "complete enough" to track.
- **D4 — `/track/[orderId]` is a minimal stub:** server page loads the order (RLS select-own) and
  renders a deadpan "accepted… never arrives" placeholder + stamp. **The MapLibre tracker stays
  Phase 7.** 404 on missing/not-owned.
- **D5 — `fake_total_cents` = the ghost (would-have-been) total** from `computeTotals`. It's the
  meaningful number for Phase 9 "money saved". Real charge is $0.00 (the gag).
- **D6 — Card data never leaves the client.** Fake payment fields (card/exp/cvc/name) are display
  theater; nothing is transmitted or stored. Only postal + line items + ghost total go to the server.

## Edge cases (enumerated up front, per build rule)
- **Empty cart** at `/checkout` → no "Place order"; show empty state / route to `/browse`.
- **Anon sign-in fails / no session** → surface a deadpan error; **do not** write an order.
- **Double-submit** (button mash) → disable the CTA + in-flight guard while processing; each accepted
  click is one append-only order (no idempotency key for v1 — flagged as acceptable for the gag).
- **Postal with no matching region** → order still created with `region_id`/dest null; never fail the
  order on a geo miss.
- **Product deleted since add-to-cart** → `order_items.product_id` is nullable (FK `set null`); store
  null + qty + options + `line_total_cents` snapshot. NOTE: `order_items` has **no name column**, so a
  deleted product loses its display name (receipt name comes from the product join). Out of scope to
  add a snapshot column in P5 — flagged.
- **Reduced motion** → the processing printer/stamp animation degrades (global reset) — verify.
- **Keyboard/focus** on the postal + payment fields and the CTAs.

---

## Slice 1 — Auth + order-write migration  (DB)
- [ ] `supabase/config.toml`: `enable_anonymous_sign_ins = true`.
- [ ] New migration: `handle_new_user` trigger (SECURITY DEFINER, fixed `search_path`) → insert into
      `profiles (id, is_anonymous)` from `new.id` / `new.is_anonymous` on `auth.users` insert.
- [ ] Same migration: `create_order(p_postal, p_region_id, p_dest_lat, p_dest_lng, p_fake_total_cents,
      p_items jsonb)` returns `uuid` — SECURITY INVOKER, inserts order (profile_id = auth.uid()) + items,
      returns id; `grant execute` to `anon, authenticated`. Guard `auth.uid() is null` → raise.
- [ ] `npm run db:reset` → `npm run db:types` → commit migration + regenerated types together.

## Slice 2 — Order API + anon session helper  (server, pure-ish)
- [ ] `lib/supabase/ensure-session.ts` (client): return existing session or `signInAnonymously()`.
- [ ] `lib/orders/payload.ts` (pure, unit-tested): map cart lines → `create_order` item rows
      (`product_id`, `qty`, `options`, `line_total_cents = priceCents*qty`); compute `fake_total_cents`
      from `computeTotals`; derive `region_id`/dest from a postal→region match. No React/Supabase.
- [ ] `app/api/orders/route.ts`: `POST` — validate body (postal, items), require session (401 if none),
      resolve region, call `create_order` RPC via the cookie server client, return `{ orderId }`.
- [ ] `tests/unit/orders-payload.test.ts`: item mapping, ghost-total mapping, empty/garbage input.

## Slice 3 — /checkout page (build to design)  [core loop]
- [ ] `app/checkout/page.tsx` (client; reads cart). Four-step state machine from the design
      (location → payment → processing → done). Order-summary receipt fed by the real cart + `computeTotals`.
- [ ] Components under `components/checkout/` (StepRail, LocationStep, PaymentStep, ProcessingStep,
      DoneStep, OrderSummary) using design tokens (dark default). Postal-only; payment fields are theater.
- [ ] Place order: `ensureSession()` → `POST /api/orders` → processing animation → `router.push(
      /track/{orderId})`. Empty-cart guard. Reduced-motion + keyboard verified.

## Slice 4 — /track/[orderId] minimal stub  [core loop]
- [ ] `app/track/[orderId]/page.tsx` (server): load order by id via RLS select-own; 404 if missing/not
      owned; render deadpan "Order accepted · never arrives" + status + NeverArrived stamp.
      **Explicitly a Phase-7 placeholder** (no map/sim).

## Slice 5 — Verify + review + PR
- [ ] `npm run verify` green; `npm run build` clean (note any dynamic vs static routes).
- [ ] DoD review (code-reviewer agent / inline). Confirm: migration-first, RLS intact, types committed,
      no service-role in client, `lib/sim` untouched, no real brands, reduced-motion/keyboard.
- [ ] Open PR `phase-5-checkout` → `main` (Closes #5 if it exists).
- [ ] ⚠️ Carry-over: env blocks headless-browser automation → flag a manual eyeball of the full loop
      (browse → cart → checkout → track) for Sujan; full e2e remains Phase 8.

## Execution model
Opus (me) plans + orchestrates + verifies; **Sonnet subagents do the building** per slice
(never Opus, per the standing rule). Each slice ends `npm run verify` green before the next.
