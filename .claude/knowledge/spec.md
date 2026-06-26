# NeverComes — SPEC

Authoritative product + technical spec for v1, derived from the design interview. Where this
spec and the planning docs differ, **this file wins for v1 scope.** Claude Code reads this.

Companions: `architecture.md`, `design.md`, `execution-phases.md`, `../rules/*`.

---

## 1. Product in one paragraph

NeverComes is a deadpan parody "dopamine site": a simulated shopping / food-delivery experience
that recreates the full ritual — browse a fake catalog, cart, checkout, watch a real-looking
courier head toward you on a real map — except the order **never arrives**. No payments, no real
inventory, no fulfillment. The browse-and-anticipate experience is the product.

---

## 2. Decision log (locked for v1)

| Area | Decision |
|---|---|
| "Never arrives" resolution | Wait ~2 min → stamp **NEVER ARRIVED** with strong animation → stop (no loop). |
| Catalog generation | AI-generated via LangGraph worker, **per region/locale, on first visit, cached in Postgres forever**. |
| Auth | Anonymous-first; upgradeable to real account (Supabase anon → permanent). |
| Location input | **Postal code only** — no street address, no precise browser geo, no IP. |
| Origin store | A **real OSM place** (cafe/shop) within ~5 mi of the postal centroid. |
| Routing | **Real road routing via self-hosted OSRM** (Docker on Railway). |
| Geo/route failure | Fall back to **city-center centroid**; ultimate fallback = synthetic path so tracking always renders. |
| Sim persistence | Persist order `created_at` + status; **resume from current stage on refresh**. |
| Refresh after 2 min | **Cap**: if elapsed > 2 min, show NEVER ARRIVED immediately (no replay). |
| OSM places fetch | **Pre-fetch & cache per region in Postgres** (Overpass is slow/rate-limited). |
| Privacy | Nothing identifiable — postal code only, no IP/precise geo. |
| Abuse / limits | **Soft cap** on cart quantity with a deadpan message. |
| Monetization | **None in v1** — prove engagement first. |
| Spec location | `.claude/knowledge/spec.md`. |

---

## 3. Core loop (end to end)

1. **Browse** the regional catalog (generated + cached, see §6).
2. **Add to cart** (client-only, Zustand + localStorage). Soft cap enforced (§9).
3. **Checkout**: enter **postal code** (no street address). Fake payment animates → **$0.00**.
4. On "Place order": the server resolves location + route (§4), writes an append-only `orders`
   row (with origin/destination/route + `created_at`), returns `orderId`.
5. **Track** (`/track/[orderId]`): real map, real road route, courier dot creeping along it, mono
   status timeline, ETA that stalls. At ~2 min → **NEVER ARRIVED** stamp animation. Stops.

---

## 4. Location & routing subsystem

The convincing part of the product. All origin/destination math keys off the **postal centroid**,
never a street address.

### Resolution pipeline (server-side, at order creation)
1. **Postal → centroid.** Look up the postal code's centroid lat/lng (cached in `regions`).
   A postal centroid is tighter than a city centroid, so routes differ meaningfully between
   neighborhoods while still collecting nothing identifiable.
2. **Pick origin store.** From `osm_places` cached for that region, choose a random real place
   (cafe/shop) within ~5 mi of the centroid. Destination = the postal centroid.
3. **Route.** Call self-hosted **OSRM** for the driving route (origin → destination); store the
   returned polyline on the order.
4. **Fallbacks (routing WILL fail):**
   - Postal not found / no centroid → use **city-center centroid**.
   - No OSM places cached/near → widen radius, else use a generic origin offset from centroid.
   - OSRM unavailable / no route → **synthetic curved path** between the two points so the
     tracker always renders. (The show must go on; failures degrade, never hard-error.)

### OSM places cache (`osm_places`)
- Overpass is rate-limited and slow, so **never call it on the request path per order.**
- First time a region is needed: fetch nearby cafes/shops via Overpass **once**, store in
  Postgres keyed by region, reuse forever. Same "generate once, cache forever" pattern as catalog.
- A background/queued job does the Overpass fetch; the order resolution reads only from Postgres.

### OSRM hosting
- Self-hosted OSRM in a **Docker container on Railway**, loaded with **region-limited** map data
  (e.g. Ontario/relevant provinces first, not the planet — keeps the image small and cheap).
- Routes may be cached per `(origin_place, postal_centroid)` pair to avoid recomputs.

---

## 5. The "never arrives" mechanic (exact behavior)

- **Timing:** target duration ~2 minutes from order `created_at` to the stamp.
- **Status machine:** `accepted → preparing → picked_up → nearby → never`. Final state is
  **never** — there is no "delivered" state anywhere in the system.
- **Animation:** courier dot interpolates along the OSRM polyline; ETA shows "~2 min away" and
  visibly stalls rather than counting to zero. At the cap, a slightly rotated **NEVER ARRIVED**
  rubber stamp animates over the card; motion stops.
- **Persistence & refresh:**
  - Source of truth is the order's `created_at` (+ a denormalized `status`).
  - On `/track` load, compute `elapsedMs = now − created_at`.
  - If `elapsedMs ≥ 120_000` → render **NEVER ARRIVED** immediately (no replay).
  - Else → resume the animation from the stage corresponding to `elapsedMs` (restart that
    stage's motion; don't replay from 0).
- **`lib/sim` stays pure:** it's a function of `(SimConfig, elapsedMs) → SimFrame`. All
  persistence/time/network lives in the React layer and the `orders` row — never in the engine.
  The never-delivered invariant is unit-tested.

---

## 6. Catalog generation (LangGraph worker)

- **Strategy:** generate **per region/locale, on first visit, then cache in Postgres forever.**
- **Latency handling:** the first visitor to a fresh region triggers an LLM batch (10–60s).
  Cover it with a deadpan **"preparing your store…"** loading state. Strongly recommended:
  **pre-seed launch regions** (run the worker ahead of time for the cities you expect first) so
  the first-visitor penalty is rare in practice.
- **Cost control:** because each region generates once and is then static, inference cost is
  bounded and the request path never calls an LLM after the first fill.
- **Content:** products/menus, descriptions, reviews, imagery — all original/fictional, no real
  brands. `ai_generated = true` on generated rows.
- The worker runs offline (scheduled or queued trigger), writes to Postgres + image CDN.

---

## 7. Auth & identity

- **Anonymous-first.** Full core loop (browse → cart → checkout → track) works with no signup.
- Supabase **anonymous auth** issues a session on first visit; order history + stats attach to
  that anon id.
- **Upgrade path:** anon → permanent account (email/OAuth) preserves history/stats.
- Owner-scoped tables under RLS on `auth.uid()`.

---

## 8. Privacy (v1 stance)

- Collect **postal code only.** No street address, no precise browser geolocation, **no IP**,
  nothing personally identifiable.
- Postal centroid is used for routing; the stored order keeps postal/region + the computed
  route, not a person's location.
- Configure PostHog to **not** capture IP or precise geo. Analytics are engagement funnels at
  region granularity, not individual tracking.
- This "we don't store your real data" posture is a deliberate trust differentiator — state it
  in a short privacy note.

---

## 9. Edge cases & abuse

- **Cart soft cap:** cap line quantity / cart size with a **deadpan message** (e.g. "Even
  imaginary warehouses have limits.") rather than a hard error. Pick concrete numbers at build
  (suggest ≤99 per line).
- **Geocode/route failure:** degrade per §4 fallbacks; never block the bit.
- **Generation latency:** loading state + pre-seeded regions per §6.
- **Refresh after 2 min:** capped to NEVER ARRIVED per §5.
- **Reduced motion:** the tracker animation degrades to a stepped/static state; the stamp still
  appears.
- **Bad/foreign postal code:** validate format loosely; on no-match, fall back to city center and
  keep going.

---

## 10. Data model deltas (beyond architecture.md §7)

Add / extend:
```
regions       (id, postal_prefix, centroid_lat, centroid_lng, city_centroid_lat,
               city_centroid_lng, catalog_generated bool, places_fetched bool, created_at)
osm_places    (id, region_id, name, lat, lng, kind, source='osm', fetched_at)
orders        (... existing ...,
               postal_code, region_id,
               origin_lat, origin_lng, origin_place_id,
               dest_lat, dest_lng,
               route_polyline jsonb,        -- OSRM geometry (or synthetic fallback)
               route_source text,           -- 'osrm' | 'synthetic'
               status,                       -- accepted|preparing|picked_up|nearby|never
               created_at)                   -- source of truth for the 2-min cap
```
- `regions`/`osm_places` are public-read (cache). `orders` owner-scoped via RLS.
- Money stays integer `*_cents`.

---

## 11. Out of scope for v1 (explicitly deferred)

- Any monetization (ads, affiliate bridge, premium cosmetics).
- Leaderboards / live "people shopping now" counters.
- Multi-country routing data (start region-limited).
- AI "describe your craving → bespoke product" and personalized recs.
- Native/mobile app.

---

## 12. Open risks to validate during build

- **OSRM on Railway footprint/cost:** confirm a region-limited OSRM image fits Railway's
  resources and stays cheap; if not, fall back to synthetic routes for MVP and add OSRM later.
- **First-visit generation UX:** the 10–60s cold fill is the riskiest UX moment; pre-seeding is
  the mitigation — validate it feels fine.
- **Postal-centroid realism:** confirm postal centroids produce believable ~5 mi routes; if too
  short in dense areas, tune the radius.
- **Overpass fetch reliability:** ensure the one-time per-region fetch handles Overpass timeouts
  gracefully (queue + retry), since it gates the first order in a region.

---

## 13. Phase fit

This spec refines, and does not replace, `execution-phases.md`. Notable touches:
- Phase 2 (data layer): add `regions`, `osm_places`, and the `orders` route/sim columns above.
- Phase 5 (checkout/order): postal-only form + the §4 resolution pipeline on order creation.
- Phase 6 (`lib/sim`): pure engine + the 2-min cap behavior; never-delivered invariant tested.
- Phase 7 (tracker): real OSRM polyline + the NEVER ARRIVED stamp + refresh/cap behavior.
- Phase 11 (AI catalog): the per-region, generate-once-cache-forever worker.
- New build task: **OSRM service** (Docker on Railway) + **Overpass cache job** — slot alongside
  Phase 5/7 since routing gates the tracker.
