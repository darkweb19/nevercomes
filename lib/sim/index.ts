/**
 * Public barrel for the lib/sim simulation engine.
 *
 * Consumers import from "@/lib/sim" — not from sub-modules directly — so the
 * internal file layout can change without breaking callers.
 */

export { step } from "./step";
export * from "./types";
export { SIM_DURATION_MS, PROGRESS_CAP } from "./constants";
