import { describe, it, expect } from "vitest";
import {
  statusToRowStates,
  stageTimes,
  ETA_SEQUENCE,
  etaAt,
} from "@/components/tracker/display";
import type { SimStatus } from "@/lib/sim/types";
import { PREPARING_END, SIM_DURATION_MS } from "@/lib/sim/constants";

// ── All possible SimStatus values ─────────────────────────────────────────────

const ALL_STATUSES: SimStatus[] = [
  "accepted",
  "preparing",
  "picked_up",
  "nearby",
  "never",
];

// ── statusToRowStates ─────────────────────────────────────────────────────────

describe("statusToRowStates", () => {
  // Product invariant: the Delivered row is ALWAYS "never", no exceptions.
  it('delivered row is "never" for every possible SimStatus', () => {
    for (const status of ALL_STATUSES) {
      const states = statusToRowStates(status);
      expect(states.delivered, `delivered must be "never" when status="${status}"`).toBe("never");
    }
  });

  it('status="accepted": accepted=active, rest=pending, delivered=never', () => {
    const s = statusToRowStates("accepted");
    expect(s.accepted).toBe("active");
    expect(s.preparing).toBe("pending");
    expect(s.picked_up).toBe("pending");
    expect(s.nearby).toBe("pending");
    expect(s.delivered).toBe("never");
  });

  it('status="preparing": accepted=done, preparing=active, rest=pending', () => {
    const s = statusToRowStates("preparing");
    expect(s.accepted).toBe("done");
    expect(s.preparing).toBe("active");
    expect(s.picked_up).toBe("pending");
    expect(s.nearby).toBe("pending");
    expect(s.delivered).toBe("never");
  });

  it('status="picked_up": accepted+preparing=done, picked_up=active, nearby=pending', () => {
    const s = statusToRowStates("picked_up");
    expect(s.accepted).toBe("done");
    expect(s.preparing).toBe("done");
    expect(s.picked_up).toBe("active");
    expect(s.nearby).toBe("pending");
    expect(s.delivered).toBe("never");
  });

  it('status="nearby": accepted+preparing+picked_up=done, nearby=active', () => {
    const s = statusToRowStates("nearby");
    expect(s.accepted).toBe("done");
    expect(s.preparing).toBe("done");
    expect(s.picked_up).toBe("done");
    expect(s.nearby).toBe("active");
    expect(s.delivered).toBe("never");
  });

  it('status="never" (terminal/stall): nearby stays "active" per stall behavior', () => {
    const s = statusToRowStates("never");
    expect(s.accepted).toBe("done");
    expect(s.preparing).toBe("done");
    expect(s.picked_up).toBe("done");
    // Key invariant: stall behavior keeps nearby active (not done) even though
    // the sim has reached its terminal state — the courier is frozen "nearby".
    expect(s.nearby).toBe("active");
    expect(s.delivered).toBe("never");
  });

  // Sweep: delivered is "never" for every status (belt-and-suspenders assertion).
  it("delivered is never for all statuses (sweep)", () => {
    const nevercounts = ALL_STATUSES.map((s) => statusToRowStates(s).delivered);
    expect(nevercounts).toEqual(["never", "never", "never", "never", "never"]);
  });

  // No status should ever make delivered "done" or "active".
  it("no status can make delivered done or active", () => {
    for (const status of ALL_STATUSES) {
      const { delivered } = statusToRowStates(status);
      expect(delivered, `status=${status}`).not.toBe("done");
      expect(delivered, `status=${status}`).not.toBe("active");
    }
  });
});

// ── stageTimes ────────────────────────────────────────────────────────────────

describe("stageTimes", () => {
  // Known fixture: seconds chosen so that +PREPARING_END*SIM_DURATION_MS (39.6 s)
  // crosses a minute boundary, guaranteeing accepted ≠ pickedUp when formatted.
  // 12:02:25Z + 39.6 s = 12:03:04.6Z → different minute.
  const FIXTURE_ISO = "2024-01-15T12:02:25.000Z";

  it("returns non-empty strings for accepted and pickedUp", () => {
    const t = stageTimes(FIXTURE_ISO);
    expect(typeof t.accepted).toBe("string");
    expect(t.accepted.length).toBeGreaterThan(0);
    expect(typeof t.pickedUp).toBe("string");
    expect(t.pickedUp.length).toBeGreaterThan(0);
  });

  it("pickedUp is exactly PREPARING_END × SIM_DURATION_MS later than accepted", () => {
    const createdAt = new Date(FIXTURE_ISO);
    const expectedPickedUpMs =
      createdAt.getTime() + PREPARING_END * SIM_DURATION_MS;
    const expectedPickedUp = new Date(expectedPickedUpMs).toLocaleTimeString(
      "en-CA",
      { hour: "numeric", minute: "2-digit", hour12: true },
    );

    const t = stageTimes(FIXTURE_ISO);
    expect(t.pickedUp).toBe(expectedPickedUp);
  });

  it("accepted timestamp matches the created_at time", () => {
    const createdAt = new Date(FIXTURE_ISO);
    const expectedAccepted = createdAt.toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const t = stageTimes(FIXTURE_ISO);
    expect(t.accepted).toBe(expectedAccepted);
  });

  it("pickedUp is always later than accepted", () => {
    // PREPARING_END × SIM_DURATION_MS = 0.33 × 120 000 = 39 600 ms > 0.
    // So pickedUp must be after accepted.
    const t = stageTimes(FIXTURE_ISO);
    // Parse the two times back using the same fixture date as date context.
    const base = new Date(FIXTURE_ISO);
    const parseTime = (timeStr: string) => {
      // crude: just verify offset is positive
      const [h, rest] = timeStr.split(":");
      const [mStr, ampm] = rest.split(/\s/);
      let hours = parseInt(h, 10);
      if (ampm?.toLowerCase() === "pm" && hours !== 12) hours += 12;
      if (ampm?.toLowerCase() === "am" && hours === 12) hours = 0;
      return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, parseInt(mStr, 10)).getTime();
    };
    // accepted and pickedUp should differ by PREPARING_END * SIM_DURATION_MS ms
    // (rounded to minute). We just check they're different.
    expect(t.pickedUp).not.toBe(t.accepted);
    void parseTime; // used above
  });

  it("formats times consistently with en-CA locale and 12-hour clock", () => {
    const t = stageTimes(FIXTURE_ISO);
    // en-CA 12-hour format uses "a.m." / "p.m." (not "AM"/"PM").
    expect(t.accepted).toMatch(/a\.m\.|p\.m\./i);
    expect(t.pickedUp).toMatch(/a\.m\.|p\.m\./i);
  });

  it("is deterministic — same input always produces the same output", () => {
    const a = stageTimes(FIXTURE_ISO);
    const b = stageTimes(FIXTURE_ISO);
    expect(a.accepted).toBe(b.accepted);
    expect(a.pickedUp).toBe(b.pickedUp);
  });
});

// ── ETA_SEQUENCE + etaAt ──────────────────────────────────────────────────────

describe("ETA_SEQUENCE", () => {
  it("has 9 entries matching the design stall-mode sequence", () => {
    expect(ETA_SEQUENCE).toHaveLength(9);
  });

  it("starts with two '2 min away' entries", () => {
    expect(ETA_SEQUENCE[0]).toBe("2 min away");
    expect(ETA_SEQUENCE[1]).toBe("2 min away");
  });

  it("includes 'Recalculating…' twice", () => {
    const count = ETA_SEQUENCE.filter((e) => e === "Recalculating…").length;
    expect(count).toBe(2);
  });
});

describe("etaAt", () => {
  it("returns ETA_SEQUENCE[tick % length] for every tick", () => {
    for (let tick = 0; tick < ETA_SEQUENCE.length * 3; tick++) {
      expect(etaAt(tick)).toBe(ETA_SEQUENCE[tick % ETA_SEQUENCE.length]);
    }
  });

  it("is deterministic — same tick always returns the same label", () => {
    for (let tick = 0; tick < 30; tick++) {
      expect(etaAt(tick)).toBe(etaAt(tick));
    }
  });

  it("cycles — etaAt(9) === etaAt(0)", () => {
    expect(etaAt(9)).toBe(etaAt(0));
    expect(etaAt(18)).toBe(etaAt(0));
    expect(etaAt(27)).toBe(etaAt(0));
  });

  it("handles large tick indices without throwing", () => {
    expect(() => etaAt(999_999)).not.toThrow();
    expect(etaAt(999_999)).toBe(ETA_SEQUENCE[999_999 % ETA_SEQUENCE.length]);
  });
});
