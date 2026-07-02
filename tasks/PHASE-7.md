# PHASE 7 — Tracker UI  [design-gated — THE hero screen]

Build `/track/[orderId]` to the imported Claude Design (`Order Tracking - Desktop.html`,
project `f36c6491`, sources `tracking/desktop.jsx` + `tracking/screen.jsx`): a desktop-first
two-column tracker — thermal-print map left, order panel right — where the courier creeps
toward HOME, the ETA loops without resolving, and at the 2-minute cap a **NEVER ARRIVED**
stamp slams over the panel.

**DoD (execution-phases §Phase 7):** courier animates toward the address and **never
arrives**; reduced-motion degrades; matches design. Plus repo invariants: `lib/sim` stays
pure and untouched (UI holds no sim math), `npm run verify` green, keyboard/focus on all
actions, no real brands.

---

## Decisions to confirm (spec ↔ design reconciliation)

- **D1 — SVG thermal map, not MapLibre (v1).** The design's map is a deliberately stylized
  SVG (carbon street grid, glow, vignette, stamp-red dashed route) — not map tiles. Real
  routing infra doesn't exist yet (`route_polyline = null`, `route_source = 'synthetic'`
  since Phase 5 D3; spec §12 explicitly sanctions "synthetic routes for MVP, add OSRM
  later"). So: implement the design's SVG map exactly; **MapLibre + OSRM move to the
  routing phase** with the rest of the geo pipeline. No new dependency.
- **D2 — One behavior: the spec's.** The design file explores four modes (stall / recede /
  fade / static). v1 ships **stall** (asymptotic creep, ETA loops, stamp at cap) as THE
  behavior, with **static** as its `prefers-reduced-motion` degradation. *recede* and
  *fade* are design explorations — out of v1 scope.
- **D3 — `lib/sim` is the authority; the design's demo hook is discarded.** The design's
  `useNeverArrives` re-implements sim logic with `performance.now()` — that was design
  theater. Production: `elapsedMs = now − order.created_at`, `step(config, elapsedMs)`
  per rAF frame; UI converts `frame.progress` → a point on the SVG route path
  (`getPointAtLength`), statuses → timeline states, `stamped` → the stamp. Load with
  `elapsed ≥ 120s` → stamp immediately, **no replay** (spec §5).
- **D4 — Buttons are cosmetic (append-only orders, no status writes).**
  "Declare it lost" → client-side stamp now (visual only, honest to the bit).
  "Track it again anyway" → replays the visual from stage 0 client-side; `created_at`
  and the DB row are untouched, so a refresh honestly snaps back to stamped.
- **D5 — Real order data replaces demo copy.** `#NC-XXXXXX` short code (already computed),
  timeline times from `created_at` + stage offsets, vendor name joined from the order's
  first item (`order_items → products → vendors`); fallback deadpan "The vendor". Courier
  stays a fictional constant ("Dev R."). ETA display strings ("Recalculating…", "1 min
  away"…) are a UI-side cycle keyed off sim status — sim's `etaLabel` stays the authority
  for *state* ("Never" ⇒ stamped); the cycle is presentation only.
- **D6 — The design's browser-chrome bar is canvas framing, not product UI** — skipped.
  Page keeps the real `SiteHeader`.

## Edge cases (enumerated up front)
- Elapsed ≥ cap on first load → stamped immediately, zero motion, no replay.
- Tab backgrounded / rAF throttled → elapsed derives from wall clock each frame, so the
  courier position is always correct on return (no drift accumulation).
- `prefers-reduced-motion` → no rAF loop: one static frame from current elapsed +
  re-render on a slow interval; stamp still appears (spec §9); pulse/flip animations off.
- Order with no items / product deleted → vendor fallback; page still renders.
- Not-owned / missing / malformed id → existing 404 guards stay.
- Keyboard: Declare-lost / Track-again / icon actions focusable with visible focus.
- SSR: server renders the shell + panel data; the animated map mounts client-side
  (no hydration mismatch on time-derived values — first frame computed in an effect).

---

## Slice 1 — primitives + motion tokens
- [ ] `components/ui/StatusPill.tsx` (transit pulse / never variants), `IconButton.tsx`
      (ghost/outline), `Perforation.tsx` (dashed route-rule with label) — per the design's
      component usage; export from `components/ui/index.ts`.
- [ ] `app/globals.css`: `ncEtaFlip` + `ncStampWrap` keyframes, `--ease-stamp`, all inside
      the existing reduced-motion guards.
- [ ] Verify green.

## Slice 2 — `components/tracker/` (client, consumes lib/sim)  [core loop]
- [ ] `TrackerMap.tsx` — the design's desktop SVG verbatim (grid, glow, vignette, WIDE_ROUTE
      dashed perforation route, origin square + vendor label, HOME pin, courier dot with
      pulse); position from `progress` via `getPointAtLength`.
- [ ] `StatusTimeline.tsx` — 4 stages + the eternally-dashed "Delivered —" row; states
      derived from `SimStatus`.
- [ ] `TrackingView.tsx` — the rAF orchestrator: wall-clock elapsed → `step()` → frame;
      ETA display cycle; stamp overlay; actions (D4); reduced-motion branch (static frame).
- [ ] Pure display helpers (`statusToStepStates`, eta-cycle, stage timestamps) in
      `components/tracker/display.ts` + unit tests `tests/unit/tracker-display.test.ts`.
- [ ] Verify green.

## Slice 3 — wire `/track/[orderId]` to the design  [core loop]
- [ ] Extend the page's select with the first item's product→vendor name; keep UUID/RLS/404
      guards; pass `{ id, createdAt, status, postal, vendorName }` into `TrackingView`.
- [ ] Two-column desktop layout per design (map fills left, panel ~400px right), stacked
      breakpoint for narrow viewports.
- [ ] Verify green + `npm run build` clean.

## Slice 4 — verify + review + PR
- [ ] Full gate: verify + build; sim untouched (`git diff --stat lib/sim` empty).
- [ ] SSR smoke (panel renders, headline, timeline, no error markers); manual in-browser
      eyeball flagged for Sujan (env still blocks headless browsers; e2e suite lands Phase 8).
- [ ] DoD review (code-reviewer agent, fresh context) — actually run to completion this time.
- [ ] PR `phase-7-tracker` → `main` (Closes #7 if it exists).

## Execution model
Fable plans/verifies; **Sonnet subagents build** slices 1–2 (I review file-by-file);
slice 3 wiring + review I do myself (integration-critical).
