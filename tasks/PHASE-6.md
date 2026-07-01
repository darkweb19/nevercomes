# PHASE 6 — Simulation engine `lib/sim`  (no design — test-first)

Pure, deterministic, framework-free engine that drives the courier tracker. Phase 7 (the MapLibre
tracker UI) consumes it via `requestAnimationFrame`; Phase 6 ships **only** the engine + its tests.
Nothing here imports React/DOM/network/Supabase (HARD RULE #4). Tests are written **before** the
implementation (`rules/testing.md`).

**DoD (execution-phases §Phase 6):** tests green; **never-delivered invariant pinned**; engine is
framework-free. Plus: `npm run verify` green; `lib/sim` has zero forbidden imports.

---

## The contract (from spec §5)

`step(config: SimConfig, elapsedMs: number): SimFrame` — a pure function of `(config, elapsedMs)`.
`elapsedMs = now − order.created_at` is computed in the **React layer** (Phase 7), never here — so
the engine has no clock and no persistence. Same inputs → identical frame.

- **Status machine (final = `never`, no delivered state anywhere):**
  `accepted → preparing → picked_up → nearby → never`. Mirrors the DB `order_status` enum
  (`accepted | preparing | picked_up | nearby | never`) exactly.
- **Timing:** default total duration **120_000 ms** (the ~2-min cap). At `elapsedMs ≥ 120_000` →
  status `never`, motion frozen, stamp shown. No replay, no loop.
- **Progress:** fraction along the route, **capped strictly below 1** (`PROGRESS_CAP`, e.g. `0.92`).
  The courier creeps toward the destination and **stalls "nearby" — it never reaches it.** This is
  the product; it is pinned by tests.
- **ETA:** hovers ("~2 min away") and stalls rather than counting to zero; on `never` it reads
  "Never".

### Stage table (within default 120s; all derived from `totalDurationMs` so it scales)
| status     | window (of total)   | progress behavior                          |
|------------|---------------------|--------------------------------------------|
| accepted   | 0 – 12.5%           | 0 (courier not moving yet)                 |
| preparing  | 12.5% – 33%         | 0 (still at origin)                         |
| picked_up  | 33% – 79%           | ramps 0 → ~0.85 along the route             |
| nearby     | 79% – 100%          | ramps ~0.85 → `PROGRESS_CAP`, then stalls   |
| never      | ≥ 100%              | frozen at `PROGRESS_CAP`; `stamped = true`  |

---

## Types (`lib/sim/types.ts`)
- `SimStatus = "accepted" | "preparing" | "picked_up" | "nearby" | "never"` — defined locally
  (zero imports keeps the engine pure); a **type-level test** asserts it stays in sync with the DB
  `order_status` enum.
- `LatLng = { lat: number; lng: number }`.
- `SimConfig = { route: LatLng[]; totalDurationMs?: number }` — `route` is the ordered origin→dest
  points (OSRM or synthetic; Phase 7 parses `orders.route_polyline` into this). `totalDurationMs`
  defaults to `SIM_DURATION_MS`.
- `SimFrame = { status: SimStatus; progress: number; position: LatLng; etaLabel: string;
  hasArrived: false; stamped: boolean }` — `hasArrived` is the literal `false` (the invariant, in
  the type).

## Constants (`lib/sim/constants.ts` or top of `step.ts`)
`SIM_DURATION_MS = 120_000`, `PROGRESS_CAP = 0.92`, and the stage boundary fractions above.

---

## Slice 1 — tests FIRST  (write, watch them fail)
Create the test files against the intended API before any implementation exists.

- [ ] `tests/unit/sim-geo.test.ts`:
  - `haversineMeters` on known coordinate pairs (± tolerance).
  - `interpolateAlongRoute(route, t)`: `t=0` → origin; `t=1` → final point; midpoint on a 2-point
    route lands halfway; clamps `t<0`/`t>1`; a 1-point route returns that point for any `t`.
- [ ] `tests/unit/sim-step.test.ts` — the invariants that ARE the product:
  - **Never-delivered (swept):** for `elapsedMs` across `[0 … 10 min]` in fine steps **and** huge
    values (`1e9`, `Number.MAX_SAFE_INTEGER`): `frame.status` is always one of the 5 known states,
    `frame.hasArrived === false`, `frame.progress < 1` (and `≤ PROGRESS_CAP`), and
    `haversineMeters(frame.position, dest) > 0` (never sits exactly on the destination).
  - **Cap:** every `elapsedMs ≥ 120_000` → `status === "never"` and `stamped === true`.
  - **Determinism:** same `config` + same `elapsedMs` → deep-equal frame (call twice).
  - **Monotonic-ish:** `progress` is non-decreasing over increasing `elapsedMs`, reaches
    `PROGRESS_CAP`, never exceeds it.
  - **Status ordering:** as `elapsedMs` grows, status advances in sequence and never regresses.
  - **Boundaries/edges:** `elapsedMs = 0` → `accepted`, `progress = 0`; negative `elapsedMs`
    clamps to 0; `route` with `< 2` points degrades (position = origin, still never arrives);
    custom `totalDurationMs` rescales the stages.
  - **Type sync:** compile-time assert `SimStatus` ≡ DB `order_status` (assignable both ways).

## Slice 2 — implement to pass  (pure engine)
- [ ] `lib/sim/types.ts` — the types above.
- [ ] `lib/sim/geo.ts` — pure `haversineMeters(a, b)` + `interpolateAlongRoute(route, t)` (walks
      cumulative segment lengths; clamps `t`).
- [ ] `lib/sim/step.ts` — stage table + `step(config, elapsedMs)`: clamp elapsed, pick stage,
      compute capped `progress`, interpolate `position`, derive `status`/`etaLabel`/`stamped`.
- [ ] `lib/sim/index.ts` — barrel: re-export `step`, types, and constants. Remove `.gitkeep`.
- [ ] Run tests green; keep any change to `lib/sim` and its tests in the same commit.

## Slice 3 — verify + purity gate + commit
- [ ] `npm run verify` green (typecheck + lint + unit). **No e2e** — the tracker UI isn't wired yet
      (that's Phase 7); the core loop is unchanged.
- [ ] Purity check: `grep -rE "react|next|supabase|fetch|document|window" lib/sim` returns nothing
      (framework-free, HARD RULE #4).
- [ ] Commit: `Phase 6: pure lib/sim engine (step) + never-delivered tests`.

## Out of scope (Phase 7, not now)
- Parsing `orders.route_polyline` jsonb → `LatLng[]` (Phase-7 glue).
- MapLibre, `requestAnimationFrame`, reduced-motion degrade, the NEVER ARRIVED stamp render — all
  Phase 7 UI. Phase 6 holds all the math; the UI holds none.

## Execution model
Opus plans/verifies; a **Sonnet subagent** may build Slice 2 to the tests. Tests (Slice 1) define
the contract — I'll author or review them closely since they encode the never-delivered invariant.
