/**
 * Core types for the pure simulation engine.
 *
 * SimStatus is defined locally here — the engine may not import types/database.ts
 * or anything outside lib/sim (HARD RULE #4: lib/sim stays pure). A compile-time
 * test in sim-step.test.ts asserts that SimStatus stays mutually assignable with
 * the DB `order_status` enum, so drift is caught at typecheck time.
 *
 * Note: hasArrived is the literal type `false`, not `boolean`. This expresses the
 * never-delivered invariant directly in the type system — a SimFrame that says the
 * order arrived is a type error.
 */

/** The five states of the fake courier journey. "never" is the terminal state. */
export type SimStatus =
  | "accepted"
  | "preparing"
  | "picked_up"
  | "nearby"
  | "never";

/** A geographic coordinate. */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Configuration for a single simulated delivery run.
 * route: ordered array of LatLng points from origin → destination.
 * totalDurationMs: optional override for the default 120 s cap.
 */
export interface SimConfig {
  route: LatLng[];
  totalDurationMs?: number;
}

/**
 * A snapshot of courier state at a given elapsed time.
 * hasArrived is the literal false — this order never completes.
 */
export interface SimFrame {
  status: SimStatus;
  /** Fraction along the route, always in [0, PROGRESS_CAP). Never reaches 1. */
  progress: number;
  /** Interpolated courier position on the route polyline. */
  position: LatLng;
  /** The ETA string shown in the UI. Stalls at "~2 min away"; becomes "Never". */
  etaLabel: string;
  /** The invariant: this order never arrives. */
  hasArrived: false;
  /** True when the never-delivered stamp should be shown (elapsed >= cap). */
  stamped: boolean;
}
