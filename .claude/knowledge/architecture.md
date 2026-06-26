# Knowledge: Architecture

Condensed reference. Full version (if present): `docs/nevercomes-architecture.md`.

## The one fact that drives everything

**There is no real commerce backend.** No payments, inventory, fulfillment, logistics, fraud,
or refunds. So NeverComes scales like a **content site, not a store**: read-heavy, write-light,
with courier tracking running **client-side** at near-zero cost per session. Optimize for
*engagement throughput*, not *transaction throughput*.

Consequences for how you build:
- Catalog is edge-cached (ISR/CDN); millions of browse reads are cheap.
- The request path makes **no LLM calls** — catalog is generated offline, not per request.
- The only meaningful server write on the request path is an **append-only fake order**.
- The courier simulation runs in the browser from the entered address; no server tick.

## Stack (locked)

- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind, Zustand (cart/session),
  MapLibre GL JS + free tiles (chosen over Mapbox to avoid per-load billing).
- **Backend:** Supabase — Postgres, Auth (anonymous-first), Realtime, Storage, RLS. No ORM;
  typed via generated `types/database.ts`.
- **Hosting:** Vercel (edge, ISR, OG image generation).
- **Catalog generation (later phase):** Python + LangGraph worker, run offline on a schedule,
  writes products/menus/reviews/images to Postgres + CDN. Never on the request path.
- **Analytics:** PostHog (engagement funnels are the core metric).

## Request path is deliberately thin

Catalog pages: statically generated / ISR, served from the edge. Cart: client-only (Zustand,
localStorage) until "order". On order: `POST /api/orders` inserts append-only `orders` +
`order_items`, returns `orderId`. Tracking: entirely client-side from `orderId` + address.
Events: mostly straight to PostHog, a few mirrored into an `events` table.

## Data model (first pass)

```
vendors      (id, name, kind['store'|'restaurant'], rating, hero_image, locale)
categories   (id, name, slug)
products     (id, vendor_id, category_id, name, description, price_cents, currency,
              rating, image_url, options jsonb, ai_generated bool)
reviews      (id, product_id, author, rating, body, ai_generated bool)
profiles     (id = auth.uid, handle, is_anonymous, created_at)
orders       (id, profile_id, address jsonb, status, fake_total_cents, currency, created_at)  -- append-only
order_items  (id, order_id, product_id, qty, options jsonb, line_total_cents)
user_stats   (profile_id, fake_spent_cents, orders_count, streak_days, achievements jsonb)
events       (id, profile_id, session_id, type, payload jsonb, ts)
```

- **Public-read:** vendors, products, reviews, categories.
- **Owner-scoped (RLS on `auth.uid()`):** profiles, orders, order_items, user_stats.
- Money is integer `*_cents` + `currency` — never floats.

## The simulation engine (`lib/sim`) — pure TS contract

```ts
type LatLng = { lat: number; lng: number }
type CourierStatus = 'accepted' | 'preparing' | 'picked_up' | 'nearby' | 'never'
interface SimConfig  { origin: LatLng; destination: LatLng; path?: LatLng[]; durationMs?: number }
interface SimFrame   { position: LatLng; progress: number; status: CourierStatus; etaLabel: string }
function step(config: SimConfig, elapsedMs: number): SimFrame   // pure, deterministic, NEVER delivers
```

The non-resolution (stalls at "2 min away" / loops / triggers the stamp) is the product, not a bug.
The `components/tracker/*` layer drives `step()` via `requestAnimationFrame` and holds no sim math.

## Scalability levers

Edge-cached catalog · generation decoupled & offline · tracking on the client · append-only
orders (no contention) · events streamed to PostHog to keep Postgres lean · realtime counters
approximated with sampled counts until exactness is actually needed.

## Privacy / IP guardrails

Prefer storing **city-level** location, not full street addresses (enough for the map; a real
trust differentiator). Keep all vendor names/logos/UI original or clearly fictional.
