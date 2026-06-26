# NeverComes — Architecture & Project Plan

> A store with everything and a checkout that resolves into nothing.
> Browse, add to cart, hit order, track the courier — then watch them never arrive.
> All the dopamine of buying. None of the receipt.

**Status:** Planning · **Target market:** Canada / US · **Author:** Sujan Shrestha

---

## 1. The concept

NeverComes is a "dopamine site": a simulated shopping / food-delivery experience that
faithfully recreates the *ritual* of buying — browsing, reviews, cart, checkout, live
courier tracking — while deliberately omitting the one thing real commerce is built around:
the transaction. Nothing is sold. Nothing ships. No money moves.

The product thesis comes straight from the behavioural-science angle behind the trend:
**dopamine spikes in anticipation of a reward, not on receipt of it.** The browse *is* the
event; the purchase was just where it used to stop. NeverComes removes the stop.

### Positioning for North America
The Korean originals lean "save money / curb impulse spending." Western audiences respond
better to the **deadpan, self-aware** framing. NeverComes is a parody-first product: the
joke is that the order is *perpetually in transit and never resolves*. The Canadian wedge is
**local muscle memory** — local restaurants/products, CAD pricing, and a courier that crawls
down a real local street on the map, mirroring the apps people already open at 2am.

---

## 2. The one architectural fact that drives everything

**There is no real commerce backend.** No payments, no inventory, no fulfillment, no
logistics, no fraud, no refunds. This single fact inverts the usual e-commerce cost model
and dictates nearly every technical decision below:

| Real e-commerce | NeverComes |
|---|---|
| Transactional integrity, inventory locking | None — orders are cheap, fake, append-only |
| Read + heavy write (payments, stock) | **Read-heavy, write-light** (browse-dominated) |
| Hard scaling: DB hotspots, payment SLAs | Easy scaling: it's closer to a **content/media site** |
| Courier tracking = real GPS, real ops | **Client-side simulation** — ~free to serve |
| Catalog = real SKUs from suppliers | **Generated catalog** — an AI/content pipeline problem |

**Consequences:**
- Scalability concerns shift to: (a) serving a large catalog cheaply, (b) generating
  infinite plausible inventory without per-request LLM cost, (c) ingesting high-volume
  engagement events (the valuable asset), (d) cheap pseudo-realtime social features.
- The courier tracking runs entirely client-side, so sessions cost almost nothing to serve.
- We optimize for *engagement throughput*, not *transaction throughput*.

---

## 3. Feature set

### Tier 0 — Core loop (MVP)
- [ ] Catalog browse: categories, infinite scroll, product/restaurant cards with imagery
- [ ] Search + filters (price, rating, category, "delivery time")
- [ ] Product detail: photos, fake reviews, ratings, options/modifiers
- [ ] Cart: add/remove, quantities, running total, fake fees + fake promo codes
- [ ] Fake checkout: address entry, a payment screen that animates and resolves to $0.00
- [ ] **Courier tracking** (the payoff): map + dashed route, courier dot moving toward
      the user's address, status timeline, ETA that counts down… then never completes
- [ ] The "never arrives" moment: ETA loops / stalls / gets a deadpan "NEVER ARRIVED" stamp
- [ ] Anonymous-first: full loop with **no signup required**

### Tier 1 — Retention & gamification
- [ ] Order history ("relive" past non-deliveries)
- [ ] "Money saved" counter (sum of fake carts you never paid for)
- [ ] Streaks + achievements ("7 nights, 0 deliveries")
- [ ] Optional account to persist stats across devices

### Tier 2 — Social & viral
- [ ] Shareable order cards (OG-image generation: "my order got abducted by a UFO")
- [ ] Public leaderboard (most fake-spent, longest streak)
- [ ] Live "X people shopping now" / "Y orders never arriving right now" counters

### Tier 3 — AI differentiation (the moat)
- [ ] **AI-generated infinite catalog** — products, menus, descriptions, reviews
- [ ] "Describe what you're craving" → generates a bespoke fake product on demand
- [ ] Personalized fake recommendations from browse history
- [ ] AI-written courier "excuses" for why it never arrived

### Tier 4 — Localization & (later) monetization hooks
- [ ] CA/US locale: local vendor names, CAD/USD, local map routes
- [ ] Affiliate "buy it for real" bridge (monetize the slice that *does* want to convert)
- [ ] Ad / sponsorship slots (tasteful, since users come here to escape ads)
- [ ] Premium cosmetics: themes, custom courier avatars, stats dashboard

---

## 4. Tech stack

Chosen to be **scalable, low-cost-to-serve, and aligned with the existing stack**
(Next.js / TS / Supabase / Vercel / n8n, growing Python + LangChain).

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | SSR/ISR for catalog SEO + edge perf; one codebase for marketing + app |
| UI | **Tailwind CSS + Radix primitives** | Fast, consistent, accessible without a heavy component lib |
| Client state | **Zustand** | Cart + session state; simpler than Redux, persists to localStorage trivially |
| Animation | **Framer Motion** | Courier movement, status reveals, the "stamp" payoff |
| Map / tracking | **MapLibre GL JS + free tiles (OpenFreeMap / Protomaps)** | Avoids Mapbox per-load billing at scale; routing via OSRM/Valhalla or faked bezier |
| Auth | **Supabase Auth (anonymous → upgrade)** | Anonymous-first matches the no-signup product; seamless upgrade to real account |
| Database | **Supabase Postgres** | Catalog, fake orders, stats, leaderboard; RLS for per-user data |
| Realtime | **Supabase Realtime** | "people shopping now", live leaderboard — cheap pub/sub |
| Storage / images | **Supabase Storage or Cloudflare R2 + image CDN** | Catalog imagery served from CDN, not the app |
| Hosting | **Vercel** | Edge functions, ISR, OG-image generation; already in your toolchain |
| Catalog generation | **Python + LangChain/LangGraph worker** | Batch-generate products/reviews/images offline; your growing strength |
| Orchestration | **n8n (scheduled) or Vercel Cron** | Trigger generation runs, refresh catalog, top up inventory |
| Analytics / events | **PostHog (self-host or cloud)** | Engagement funnels = the core metric; the valuable dataset |
| Tooling | **pnpm + Turborepo + ESLint + Prettier + Vitest/Playwright** | Monorepo-ready, fast CI, testable from day one |

### Decisions worth flagging
- **MapLibre over Mapbox:** Mapbox bills per map load. A dopamine site is *all* map loads
  with zero revenue per session — Mapbox economics are backwards for this. MapLibre + free
  vector tiles keeps the highest-engagement feature free to serve.
- **Generation is batched, never per-request:** LLM/image calls happen in an offline worker
  and land in Postgres + CDN. The request path never touches an LLM, so latency and cost
  stay flat as traffic grows.
- **Anonymous-first auth:** the browse is the product; a signup wall would kill the funnel.
  Accounts are an upgrade for people who want to keep their stats.

---

## 5. System architecture

```
                       ┌──────────────────────────────┐
                       │   Generation pipeline (async) │
                       │  Python + LangGraph worker     │
                       │  • product/menu/review gen     │
                       │  • image gen / sourcing        │
                       │  triggered by n8n / Vercel Cron│
                       └───────────────┬────────────────┘
                                       │ writes catalog
                                       ▼
   Browser (Next.js client)     ┌──────────────┐        ┌─────────────┐
   ┌───────────────────────┐    │   Supabase    │        │  Image CDN  │
   │ • catalog browse (ISR)│◄──►│  Postgres     │        │  (R2/Storage)│
   │ • cart (Zustand)      │    │  Auth (anon)  │        └─────────────┘
   │ • fake checkout       │    │  Realtime     │
   │ • COURIER SIM (local) │    │  RLS          │
   │ • OG share images     │    └──────┬────────┘
   └───────────┬───────────┘           │
               │ events                 │ leaderboard / live counters
               ▼                        ▼
        ┌─────────────┐          (Supabase Realtime channels)
        │  PostHog    │
        │  (analytics)│
        └─────────────┘
```

**Request path is deliberately thin.** Catalog pages are statically generated / ISR-cached
and served from the edge. The courier simulation runs in the browser against the address the
user typed — no server round-trips while "tracking." The server's only writes are: an
append-only fake `order` record and an event stream. That's why it scales like a content
site, not a store.

---

## 6. Codebase structure

### 6a. MVP — single Next.js app (start here)
Right-sized for a weekend build. Modular boundaries so it can split later without a rewrite.

```
nevercomes/
├─ app/
│  ├─ (marketing)/page.tsx        # landing / hero
│  ├─ browse/page.tsx             # catalog (ISR)
│  ├─ product/[id]/page.tsx       # product detail
│  ├─ cart/page.tsx
│  ├─ checkout/page.tsx           # fake checkout
│  ├─ track/[orderId]/page.tsx    # courier sim
│  ├─ me/page.tsx                 # stats / history (auth)
│  ├─ api/
│  │  ├─ orders/route.ts          # create fake order (append-only)
│  │  └─ og/route.tsx             # share-card image generation
│  └─ layout.tsx
├─ components/
│  ├─ catalog/                    # cards, grid, filters
│  ├─ cart/
│  ├─ checkout/
│  ├─ tracker/                    # Map, RouteLine, CourierDot, StatusTimeline
│  └─ ui/                         # primitives
├─ lib/
│  ├─ supabase/                   # client/server, types
│  ├─ store/                      # Zustand (cart, session)
│  ├─ sim/                        # courier simulation engine (pure TS)
│  └─ analytics/                  # event helpers
├─ public/
├─ supabase/                      # migrations, seed, RLS policies
└─ package.json
```

### 6b. Scale target — Turborepo monorepo (grow into this)
When the generator, shared types, and a possible native app justify separation:

```
nevercomes/
├─ apps/
│  ├─ web/                        # the Next.js app (6a moves here)
│  └─ generator/                  # Python LangGraph catalog worker
├─ packages/
│  ├─ db/                         # Supabase schema, migrations, generated types
│  ├─ sim/                        # courier simulation engine (shared)
│  ├─ ui/                         # design system
│  ├─ types/                      # shared TS contracts
│  └─ config/                     # eslint/tailwind/ts presets
├─ turbo.json
└─ pnpm-workspace.yaml
```

> **Right-sizing note:** don't build the monorepo on day one. Ship 6a, keep the module
> boundaries clean (especially `lib/sim` as pure, dependency-free TS), and peel services off
> into 6b only when load or team size demands it.

---

## 7. Data model (first pass)

```sql
vendors        (id, name, kind['store'|'restaurant'], rating, hero_image, locale)
categories     (id, name, slug)
products       (id, vendor_id, category_id, name, description, price_cents,
                currency, rating, image_url, options jsonb, ai_generated bool)
reviews        (id, product_id, author, rating, body, ai_generated bool)

profiles       (id ↔ auth.uid, handle, is_anonymous, created_at)
orders         (id, profile_id, address jsonb, status, fake_total_cents,
                currency, created_at)          -- append-only, never "completes"
order_items    (id, order_id, product_id, qty, options jsonb, line_total_cents)
user_stats     (profile_id, fake_spent_cents, orders_count, streak_days, achievements jsonb)

events         (id, profile_id, session_id, type, payload jsonb, ts)  -- mirror to PostHog
```

RLS: `orders`, `order_items`, `user_stats`, `profiles` scoped to `auth.uid()`.
`vendors`, `products`, `reviews`, `categories` are public-read.

---

## 8. The courier simulation engine (`lib/sim`)

The signature feature. Keep it **pure, framework-free TypeScript** so it's testable and
portable to a future native app.

- Input: origin (plausible nearby vendor point) + destination (geocoded user address).
- Route: real road polyline via OSRM/Valhalla, **or** a faked bezier/great-circle path to
  avoid any routing dependency for MVP.
- Tick loop: interpolate the courier position along the path over time (`requestAnimationFrame`).
- Status machine: `accepted → preparing → picked_up → nearby → (never delivered)`.
- The payoff: on "arrival," it does **not** resolve — it stalls at "2 min away," loops, or
  triggers the deadpan stamp. This non-resolution is the product, not a bug.

---

## 9. Scalability strategy

1. **Catalog at the edge** — ISR + CDN. Millions of browse reads cost almost nothing.
2. **Generation decoupled** — async worker writes to DB/CDN; request path never calls an LLM.
3. **Tracking on the client** — zero server cost per active "delivery."
4. **Append-only orders** — no transactional contention, trivially shardable later.
5. **Events as the heavy write** — batch/stream to PostHog; keep Postgres lean.
6. **Realtime kept cheap** — approximate "people shopping now" with sampled counts, not
   per-user fan-out, until it actually needs to be exact.

---

## 10. Roadmap

- **Phase 1 — MVP loop (weekend):** seed catalog (hand-authored), browse → cart → fake
  checkout → courier sim → "never arrives." Anonymous, no accounts. Ship the landing page.
- **Phase 2 — retention:** accounts, stats, history, "money saved," streaks.
- **Phase 3 — viral:** OG share cards, leaderboard, live counters.
- **Phase 4 — AI catalog:** Python/LangGraph generator + n8n schedule; infinite inventory.
- **Phase 5 — localize + monetize hooks:** CA/US locales, affiliate bridge, premium cosmetics.

---

## 11. Open questions & risks

- **Naming / IP:** "NeverComes" is clean. Do **not** mirror real brands (no "Amazon",
  "Uber Eats", "SkipTheDishes" marks, logos, or UI clones). Local *flavour* is fine;
  *impersonation* invites trademark trouble. Keep vendor names original or clearly fictional.
- **Privacy:** address + browse data is sensitive even when "fake." Be explicit in a privacy
  note about what's stored; consider not persisting full addresses (city-level is enough for
  the map). This is also a trust differentiator vs. the unexamined Korean originals.
- **Mental-health framing:** position as playful/harm-reduction, not as a cure for compulsive
  spending — experts note it redirects the loop rather than fixing it. Don't over-claim.
- **Western skepticism:** the open assumption is "Westerners won't bite." Treat the MVP as a
  cheap experiment to test exactly that, with engagement analytics from day one.
- **Map cost:** validate MapLibre + free tiles early; it's the one feature that could get
  expensive if you default to a billed provider.

---

*Next step: lock the stack decisions you agree with, then scaffold Phase 1.*
