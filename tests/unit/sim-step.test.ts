import { describe, it, expect } from "vitest";
import { step, SIM_DURATION_MS, PROGRESS_CAP } from "@/lib/sim";
import { haversineMeters } from "@/lib/sim/geo";
import type { LatLng, SimConfig, SimStatus } from "@/lib/sim/types";
import type { Database } from "@/types/database";

// ---------------------------------------------------------------------------
// Type sync: SimStatus must stay identical to the DB order_status enum.
// lib/sim defines its own union (it may not import Supabase types), so this
// compile-time check is what keeps the two from drifting apart.
// ---------------------------------------------------------------------------

type DbOrderStatus = Database["public"]["Enums"]["order_status"];

// Mutually assignable ⇒ the unions are identical. A drift on either side is a
// type error here, failing `npm run verify` at typecheck.
const _simToDb: DbOrderStatus[] = [] as SimStatus[];
const _dbToSim: SimStatus[] = [] as DbOrderStatus[];
void _simToDb;
void _dbToSim;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORIGIN: LatLng = { lat: 43.6512, lng: -79.3832 }; // downtown-ish
const MID: LatLng = { lat: 43.6702, lng: -79.3925 };
const DEST: LatLng = { lat: 43.7001, lng: -79.4005 }; // "your place"

const CONFIG: SimConfig = { route: [ORIGIN, MID, DEST] };

const KNOWN_STATUSES: SimStatus[] = [
  "accepted",
  "preparing",
  "picked_up",
  "nearby",
  "never",
];

// ---------------------------------------------------------------------------
// THE product invariant: the order never arrives. Ever.
// ---------------------------------------------------------------------------

describe("never-delivered invariant", () => {
  it("never arrives for any elapsed time from 0 to 10 minutes", () => {
    for (let ms = 0; ms <= 600_000; ms += 500) {
      const frame = step(CONFIG, ms);
      expect(KNOWN_STATUSES).toContain(frame.status);
      expect(frame.hasArrived).toBe(false);
      expect(frame.progress).toBeLessThan(1);
      expect(frame.progress).toBeLessThanOrEqual(PROGRESS_CAP);
      // The courier never sits exactly on the destination.
      expect(haversineMeters(frame.position, DEST)).toBeGreaterThan(0);
    }
  });

  it("never arrives even at absurdly large elapsed times", () => {
    for (const ms of [1e9, 1e12, Number.MAX_SAFE_INTEGER]) {
      const frame = step(CONFIG, ms);
      expect(frame.status).toBe("never");
      expect(frame.hasArrived).toBe(false);
      expect(frame.progress).toBeLessThan(1);
      expect(haversineMeters(frame.position, DEST)).toBeGreaterThan(0);
    }
  });

  it('has no "delivered"-like status anywhere in the machine', () => {
    for (const status of KNOWN_STATUSES) {
      expect(status).not.toMatch(/deliver|arrived|complete/i);
    }
  });
});

// ---------------------------------------------------------------------------
// The 2-minute cap
// ---------------------------------------------------------------------------

describe("the 2-minute cap", () => {
  it("is 120 seconds by default", () => {
    expect(SIM_DURATION_MS).toBe(120_000);
  });

  it("stamps NEVER at exactly the cap", () => {
    const frame = step(CONFIG, SIM_DURATION_MS);
    expect(frame.status).toBe("never");
    expect(frame.stamped).toBe(true);
  });

  it("stamps NEVER for every elapsed time past the cap", () => {
    for (const ms of [SIM_DURATION_MS + 1, 150_000, 300_000, 1e7]) {
      const frame = step(CONFIG, ms);
      expect(frame.status).toBe("never");
      expect(frame.stamped).toBe(true);
      expect(frame.etaLabel).toBe("Never");
    }
  });

  it("is not stamped one tick before the cap", () => {
    const frame = step(CONFIG, SIM_DURATION_MS - 1);
    expect(frame.status).toBe("nearby");
    expect(frame.stamped).toBe(false);
  });

  it("freezes motion after the cap (frames past 2 min are identical)", () => {
    const a = step(CONFIG, SIM_DURATION_MS);
    const b = step(CONFIG, SIM_DURATION_MS + 90_000);
    expect(b).toEqual(a);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("determinism", () => {
  it("returns deep-equal frames for identical inputs", () => {
    for (const ms of [0, 7_331, 45_000, 100_000, 119_999, 240_000]) {
      expect(step(CONFIG, ms)).toEqual(step(CONFIG, ms));
    }
  });

  it("does not mutate the config", () => {
    const config: SimConfig = { route: [ORIGIN, MID, DEST] };
    const snapshot = JSON.parse(JSON.stringify(config));
    step(config, 60_000);
    expect(config).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------
// Monotonic-ish progress toward (never reaching) the destination
// ---------------------------------------------------------------------------

describe("progress", () => {
  it("is non-decreasing as elapsed time grows", () => {
    let prev = -Infinity;
    for (let ms = 0; ms <= 300_000; ms += 250) {
      const { progress } = step(CONFIG, ms);
      expect(progress).toBeGreaterThanOrEqual(prev);
      prev = progress;
    }
  });

  it("starts at 0 and ends stalled exactly at the cap", () => {
    expect(step(CONFIG, 0).progress).toBe(0);
    expect(step(CONFIG, SIM_DURATION_MS).progress).toBe(PROGRESS_CAP);
    expect(step(CONFIG, 999_999_999).progress).toBe(PROGRESS_CAP);
  });

  it("actually moves the courier during transit", () => {
    const early = step(CONFIG, 45_000); // picked_up window
    const late = step(CONFIG, 110_000); // nearby window
    expect(late.progress).toBeGreaterThan(early.progress);
    expect(haversineMeters(late.position, DEST)).toBeLessThan(
      haversineMeters(early.position, DEST),
    );
  });
});

// ---------------------------------------------------------------------------
// Status machine ordering
// ---------------------------------------------------------------------------

describe("status machine", () => {
  it("advances in order and never regresses", () => {
    let prevIndex = 0;
    for (let ms = 0; ms <= 300_000; ms += 250) {
      const { status } = step(CONFIG, ms);
      const index = KNOWN_STATUSES.indexOf(status);
      expect(index).toBeGreaterThanOrEqual(prevIndex);
      prevIndex = index;
    }
  });

  it("visits every stage across the default duration", () => {
    const seen = new Set<SimStatus>();
    for (let ms = 0; ms <= SIM_DURATION_MS; ms += 100) {
      seen.add(step(CONFIG, ms).status);
    }
    expect([...seen].sort()).toEqual([...KNOWN_STATUSES].sort());
  });

  it("holds the courier at the origin before pickup", () => {
    for (const ms of [0, 10_000, 30_000]) {
      const frame = step(CONFIG, ms);
      expect(["accepted", "preparing"]).toContain(frame.status);
      expect(frame.progress).toBe(0);
      expect(frame.position).toEqual(ORIGIN);
    }
  });
});

// ---------------------------------------------------------------------------
// ETA theater: stalls at "~2 min away", never counts down to zero
// ---------------------------------------------------------------------------

describe("etaLabel", () => {
  it('reads "~2 min away" for the whole ride', () => {
    for (let ms = 0; ms < SIM_DURATION_MS; ms += 1_000) {
      expect(step(CONFIG, ms).etaLabel).toBe("~2 min away");
    }
  });

  it('reads "Never" once stamped', () => {
    expect(step(CONFIG, SIM_DURATION_MS).etaLabel).toBe("Never");
  });
});

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("clamps negative elapsed time to the start", () => {
    expect(step(CONFIG, -5_000)).toEqual(step(CONFIG, 0));
  });

  it("degrades a single-point route without arriving", () => {
    const solo: SimConfig = { route: [ORIGIN] };
    for (const ms of [0, 60_000, 200_000]) {
      const frame = step(solo, ms);
      expect(frame.position).toEqual(ORIGIN);
      expect(frame.hasArrived).toBe(false);
      expect(frame.progress).toBeLessThan(1);
    }
  });

  it("degrades an empty route without throwing", () => {
    const empty: SimConfig = { route: [] };
    for (const ms of [0, 60_000, 200_000]) {
      const frame = step(empty, ms);
      expect(frame.hasArrived).toBe(false);
      expect(KNOWN_STATUSES).toContain(frame.status);
    }
  });

  it("rescales every stage to a custom total duration", () => {
    const config: SimConfig = { route: [ORIGIN, MID, DEST], totalDurationMs: 60_000 };
    expect(step(config, 0).status).toBe("accepted");
    expect(step(config, 30_000).status).toBe("picked_up"); // 50% of 60s
    expect(step(config, 59_999).status).toBe("nearby");
    expect(step(config, 60_000).status).toBe("never");
    expect(step(config, 60_000).stamped).toBe(true);
  });
});
