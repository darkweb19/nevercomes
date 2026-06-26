# Knowledge: Execution phases (build the project ONE phase at a time)

Proceed strictly in order. Do not start a phase until:
(a) the previous phase's **Definition of Done** is met, and
(b) if the phase is **[design-gated]**, its Claude Design screen has been provided.

At the start of each phase: enter plan mode, write `tasks/PHASE-<n>.md` as a checklist, get
approval, then implement. End each phase with `npm run verify` (and `test:e2e` if the core loop
changed) and a commit.

---

## Phase 0 — Scaffold  (no design needed)
Stand up the project skeleton; build no features.
- Next.js 14 App Router + TS + Tailwind; ESLint/Prettier; Vitest + Playwright.
- `supabase init`; create the folder structure (app/, components/, lib/{supabase,store,sim,
  analytics,utils}, types/, supabase/, tests/).
- Add the full `package.json` scripts block (incl. all `db:*` + `verify`).
- `.env.example` documenting required vars (no secrets).
- **DoD:** `npm run dev` boots; `npm run verify` runs (even if trivially green); empty structure
  matches `knowledge/architecture.md`.

## Phase 1 — Design tokens → Tailwind + UI primitives  (uses the ready design system)
- Wire `knowledge/design.md` tokens into the Tailwind theme (colors, fonts, spacing, radius).
- Build `components/ui` primitives (Button, Input, Card, Badge, Sheet, Stamp) to match.
- Put them on a `/_scratch` page for visual review.
- **DoD:** primitives render with real tokens; fonts loaded; I've eyeballed them.

## Phase 2 — Data layer  (no design needed)
- First migration for the data model (vendors, categories, products, reviews, profiles, orders,
  order_items, user_stats, events). **RLS policies in the same migration** per `rules/`.
- `seed.sql` with ~30 fictional products across a few vendors (original names only).
- `npm run db:reset` then `npm run db:types`. Typed `supabase-js` clients in `lib/supabase`.
- **DoD:** local DB rebuilds from migrations; `types/database.ts` committed; a typed sample query works.

## Phase 3 — Catalog browse + product detail  [design-gated]
- `/browse` (ISR, infinite scroll, filters, search) + `/product/[id]` (images, fake reviews,
  options, add-to-cart) reading via generated types. Build to the provided designs.
- **DoD:** ≥1 page of catalog from Postgres; filters/search work; add-to-cart updates the store.

## Phase 4 — Cart  [design-gated]
- Zustand `lib/store/cart.ts` persisted to localStorage: lines, quantities, fake fees, a fake
  promo code, running total. CartDrawer + cart page. Cart never hits the server until order.
- **DoD:** cart math correct (integer cents); persists across reload; matches design.

## Phase 5 — Fake checkout + order  [design-gated]
- `/checkout`: address form → fake payment that animates and resolves to **$0.00** →
  `POST /api/orders` (append-only `orders` + `order_items`) → redirect to `/track/[orderId]`.
- **DoD:** full loop works with **no account**; order row created; routes to tracker.

## Phase 6 — Simulation engine `lib/sim`  (no design needed — test-first)
- Per `rules/testing.md`: write Vitest tests FIRST (never-delivered invariant, determinism),
  then implement pure `step()`. Zero React/network imports.
- **DoD:** tests green; never-delivered invariant pinned; engine is framework-free.

## Phase 7 — Tracker UI  [design-gated — THE hero screen]
- `components/tracker` (MapLibre + free tiles, RouteLine, CourierDot, StatusTimeline,
  NeverArrivedStamp) + `/track/[orderId]`. Consumes `lib/sim` via requestAnimationFrame; holds
  no sim math. Respect `prefers-reduced-motion`. Lazy-load MapLibre only on this route.
- **DoD:** courier animates toward the address and **never arrives**; reduced-motion degrades; matches design.

## Phase 8 — Landing + end-to-end  [design-gated]
- Landing/hero from the Claude Design screen. Playwright e2e for the full anonymous loop:
  browse → product → cart → checkout → track.
- **DoD:** `npm run test:e2e` green; full §11 PR checklist passes.

---

## Later phases (after the core loop ships)

- **Phase 9 — Retention:** accounts (anon→upgrade), `me` stats/history, "money saved", streaks.
- **Phase 10 — Viral:** OG share-card image route, leaderboard, live "people shopping now" counters.
- **Phase 11 — AI catalog:** Python/LangGraph generator + scheduled trigger; infinite inventory
  written offline to Postgres + CDN (never on the request path).
- **Phase 12 — Localize + monetize hooks:** CA/US locales (local vendors, CAD/USD, local map
  routes), affiliate "buy it for real" bridge, premium cosmetics.

Each later phase follows the same protocol: design-gate if it has UI, plan → build → verify → commit.
