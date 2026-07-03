"use client";

/**
 * TrackingView — the desktop tracker orchestrator.
 *
 * Two-column layout: SVG thermal map (left) · order panel (right).
 * Stacks to one column below `lg` breakpoint.
 *
 * Behaviour (D2 — v1 ships "stall" + "static" only):
 *  - Animated path: rAF loop → elapsed = Date.now() - createdAtMs - replayOffset
 *    → frame = step({ route: [] }, elapsed). Empty route is intentional: the SVG
 *    map derives courier position from frame.progress on its own SVG path via
 *    getPointAtLength — it does not need real LatLng coordinates.
 *  - Reduced-motion path: no rAF; one frame on mount, re-computed every 5 s.
 *  - Elapsed ≥ cap on first load → frame is already stamped; stamp shows
 *    immediately, zero motion.
 *  - "Declare it lost" → sets declaredLost (client-only stamp, cosmetic).
 *  - "Track it again anyway" → resets replayOffset to current elapsed so the
 *    visual replays from stage 0; DB / created_at are untouched.
 *
 * D3: lib/sim is the authority. All sim math lives in lib/sim; this file holds
 * no progress formulas, no ETA asymptotes, no stage boundary fractions.
 * D4: buttons are cosmetic — no status writes to the DB.
 * D5: shortCode and vendorName come from the DB (passed as props by the page).
 * D6: browser-chrome bar is canvas framing — not built here.
 */

import { useEffect, useRef, useState } from "react";
import { step } from "@/lib/sim";
import type { SimFrame } from "@/lib/sim/types";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconButton } from "@/components/ui/IconButton";
import { Perforation } from "@/components/ui/Perforation";
import { Stamp } from "@/components/ui/Stamp";
import { StatusPill } from "@/components/ui/StatusPill";
import { etaAt, stageTimes, statusToRowStates } from "./display";
import { StatusTimeline } from "./StatusTimeline";
import { TrackerMap } from "./TrackerMap";

// ── Constants ────────────────────────────────────────────────────────────────

/** ETA cycle tick interval (matches the design reference: 2600 ms). */
const ETA_TICK_MS = 2600;

/** Reduced-motion re-render interval: update the static frame every 5 s. */
const STATIC_INTERVAL_MS = 5000;

// ── Inline icon components ────────────────────────────────────────────────────
// Avoids an external icon dependency for the 5 tracker-specific glyphs.

function MessageIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ── Client state ──────────────────────────────────────────────────────────────

/**
 * Client-only state initialised in a single useEffect call.
 * null = not yet mounted (SSR); non-null = hydrated with reduce + first frame.
 * Using a single object avoids firing multiple synchronous setState calls from
 * the mount effect, which triggers a lint warning.
 */
interface ClientState {
  reduce: boolean;
  frame: SimFrame;
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface TrackingViewProps {
  /** e.g. "NC-4A3B2C" — the human-readable short order code. */
  shortCode: string;
  /** ISO timestamp of when the order was created (order.created_at). */
  createdAtIso: string;
  /** Vendor name from the first order item; null when unknown. */
  vendorName: string | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TrackingView({
  shortCode,
  createdAtIso,
  vendorName,
}: TrackingViewProps) {
  // SSR safety: null until the first mount effect fires.
  // All time-derived state lives here so nothing is computed during render.
  const [client, setClient] = useState<ClientState | null>(null);
  const [etaTick, setEtaTick] = useState(0);
  const [replayOffset, setReplayOffset] = useState(0);
  const [declaredLost, setDeclaredLost] = useState(false);

  // Stable refs used inside rAF callbacks (avoid stale-closure captures).
  const createdAtMs = useRef(new Date(createdAtIso).getTime());
  // replayOffset mirrored in a ref so the rAF tick always reads the latest value.
  const replayOffsetRef = useRef(0);

  // Derived from client state for readability.
  const mounted = client !== null;
  const reduce = client?.reduce ?? false;
  const frame = client?.frame ?? null;

  const displayVendor = vendorName ?? "The vendor";
  // Times are user-local (toLocaleTimeString), so computing them during SSR
  // would bake the SERVER's timezone into the HTML and mismatch on hydration.
  // Render placeholders until mounted; the client fills in local times.
  const times = mounted
    ? stageTimes(createdAtIso)
    : { accepted: "—", pickedUp: "—" };

  // Whether the tracker shows the "never arrived" presentation.
  const isStamped = declaredLost || (frame?.stamped ?? false);

  // ── 1. Mount: detect reduced-motion + compute first frame (single setState) ─

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elapsed =
      Date.now() - createdAtMs.current - replayOffsetRef.current;
    // Single setState call → avoids the lint rule for synchronous setState in
    // effect bodies while still setting both values atomically.
    setClient({ reduce: mq.matches, frame: step({ route: [] }, elapsed) });
  }, []); // runs once on mount

  // ── 2. rAF loop (animated path, when not reduce or stamped) ─────────────────

  useEffect(() => {
    if (!mounted || reduce || isStamped) return;

    let rafId: number;

    function tick() {
      const elapsed =
        Date.now() - createdAtMs.current - replayOffsetRef.current;
      const f = step({ route: [] }, elapsed);
      // Functional update: preserves `reduce` while replacing `frame`.
      setClient((prev) => (prev ? { ...prev, frame: f } : null));
      if (!f.stamped) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mounted, reduce, isStamped, replayOffset]);

  // ── 3. Reduced-motion path: stepped 5 s interval ────────────────────────────

  useEffect(() => {
    if (!mounted || !reduce || isStamped) return;

    const id = setInterval(() => {
      const elapsed =
        Date.now() - createdAtMs.current - replayOffsetRef.current;
      setClient((prev) =>
        prev ? { ...prev, frame: step({ route: [] }, elapsed) } : null,
      );
    }, STATIC_INTERVAL_MS);

    return () => clearInterval(id);
  }, [mounted, reduce, isStamped, replayOffset]);

  // ── 4. ETA cycle: tick every 2600 ms while active ───────────────────────────

  useEffect(() => {
    if (!mounted || isStamped || reduce) return;

    const id = setInterval(() => {
      setEtaTick((t) => t + 1);
    }, ETA_TICK_MS);

    return () => clearInterval(id);
  }, [mounted, isStamped, reduce]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  function handleDeclareLost() {
    setDeclaredLost(true);
  }

  function handleReplay() {
    // Set replayOffset so elapsed restarts from ~0.
    // elapsed = Date.now() - createdAtMs - replayOffset
    // To get elapsed ≈ 0: newReplayOffset = Date.now() - createdAtMs
    const newOffset = Date.now() - createdAtMs.current;
    replayOffsetRef.current = newOffset;
    setReplayOffset(newOffset);
    setDeclaredLost(false);
    setEtaTick(0);
    // Immediately set frame to elapsed=0 state to avoid null flash.
    setClient((prev) =>
      prev ? { ...prev, frame: step({ route: [] }, 0) } : null,
    );
  }

  // ── Derived display values ────────────────────────────────────────────────────

  const progress = frame?.progress ?? 0;
  const rowStates = frame
    ? statusToRowStates(frame.status)
    : statusToRowStates("accepted");

  // Headlines (D2: stall + static copy only).
  const headline = isStamped ? "It’s not coming." : "Your courier is close.";
  const subtitle =
    isStamped && reduce
      ? "Frozen two streets out. It was never going to arrive, so nothing moves."
      : "Two streets away and holding. The dot moves. The bag does not.";

  // ETA hero. frame.etaLabel is intentionally bypassed here: the sim's label
  // is the *state* authority ("~2 min away" | "Never"), but the design calls
  // for a richer looping display cycle (D5) — so we key off isStamped (which
  // follows frame.stamped) and run ETA_SEQUENCE for the theater in between.
  // Key = the display string itself (per the design): consecutive identical
  // labels ("2 min away" → "2 min away") don't re-trigger the flip.
  const etaValue = isStamped ? "Never" : etaAt(etaTick);
  const etaKey = etaValue;
  // "Live" labels ("… min away", "Almost there") glow transit-gold; stalls
  // ("Recalculating…") and the terminal "Never" go faint — per the design.
  const etaLive = !isStamped && /min|there/.test(etaValue);

  const courierMeta = isStamped
    ? "LAST SEEN · NEARBY"
    : "YOUR COURIER · ⋆ 4.9";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row" style={{ minHeight: "520px" }}>
      {/* ── LEFT: Map ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1" style={{ minHeight: "320px" }}>
        {mounted && (
          <TrackerMap
            progress={progress}
            reduce={reduce}
            vendorLabel={displayVendor}
          />
        )}
        {/* Status pill — top-right corner of map, per the design */}
        <div className="absolute right-3 top-3">
          <StatusPill
            variant={isStamped ? "never" : "transit"}
            pulse={!reduce && !isStamped}
          />
        </div>
      </div>

      {/* ── RIGHT: Panel ──────────────────────────────────────────────────── */}
      {/* Full-width when stacked (below lg); fixed panel column on desktop.
          The width must NOT apply on mobile — hence classes, not inline style. */}
      <div className="relative flex w-full flex-col border-hairline lg:w-[clamp(320px,35%,420px)] lg:flex-none lg:border-l">
        {/* Panel head: order code + icon actions */}
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div>
            <div className="font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
              Order
            </div>
            <div className="font-mono text-sm font-bold text-fg-strong">
              #{shortCode}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IconButton variant="outline" aria-label="Message courier">
              <MessageIcon />
            </IconButton>
            <IconButton variant="outline" aria-label="Call courier">
              <PhoneIcon />
            </IconButton>
            <IconButton variant="ghost" aria-label="Share order">
              <ShareIcon />
            </IconButton>
          </div>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Eyebrow rule className="mb-4">
            {isStamped ? "Tracking closed" : "Live tracking"}
          </Eyebrow>

          <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight text-fg-strong">
            {headline}
          </h1>
          <p className="mb-5 text-sm leading-relaxed text-fg-muted">{subtitle}</p>

          {/* ETA hero card */}
          <div className="mb-4 rounded-md bg-card px-5 py-4">
            <div className="mb-1 font-mono text-2xs font-bold uppercase tracking-label text-fg-muted">
              Est. Arrival
            </div>
            {/* key forces remount on change; inner element carries ncEtaFlip */}
            <div
              key={etaKey}
              className="font-mono text-2xl font-bold"
              style={{
                color: etaLive
                  ? "var(--status-transit)"
                  : "var(--text-faint)",
                animation:
                  !reduce && !isStamped
                    ? "ncEtaFlip var(--dur-base) var(--ease-out) both"
                    : "none",
              }}
            >
              {etaValue}
            </div>
          </div>

          {/* Courier card */}
          <div className="mb-4 flex items-center gap-3 rounded-md border border-hairline px-4 py-3">
            <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-card font-mono text-xs font-bold text-fg-strong">
              DR
            </span>
            <div className="min-w-0">
              <div className="font-mono text-sm font-bold text-fg-strong">
                Dev R.
              </div>
              <div className="font-mono text-2xs uppercase tracking-label text-fg-muted">
                {courierMeta}
              </div>
            </div>
          </div>

          {/* Route perforation divider */}
          <Perforation
            variant="route"
            label={isStamped ? "Route abandoned" : "Route"}
            className="my-3"
          />

          {/* Status timeline */}
          <StatusTimeline
            rowStates={rowStates}
            acceptedTime={times.accepted}
            pickedUpTime={times.pickedUp}
            vendorName={displayVendor}
          />
        </div>

        {/* Actions footer */}
        <div className="border-t border-hairline px-6 py-5">
          {!isStamped ? (
            <>
              <Button
                variant="danger"
                block
                onClick={handleDeclareLost}
                className="mb-3"
              >
                <XIcon />
                Declare it lost
              </Button>
              <p className="text-center font-mono text-2xs uppercase tracking-label text-fg-faint">
                No refund. Nothing was charged.
              </p>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                block
                onClick={handleReplay}
                className="mb-3"
              >
                <RotateIcon />
                Track it again anyway
              </Button>
              <p className="text-center font-mono text-2xs uppercase tracking-label text-fg-faint">
                All the dopamine of buying. None of the receipt.
              </p>
            </>
          )}
        </div>

        {/* Stamp overlay — absolute over the panel (per desktop design).
            Reuses the Stamp primitive (which owns the tilt + brand treatment);
            the wrapper div carries ncStampWrap (scale/opacity only) so the
            animation never fights the primitive's rotation, and the tilt
            survives reduced motion. aria-hidden: the stamped state is already
            announced by the headline + status pill. */}
        {isStamped && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            aria-hidden="true"
          >
            <div
              style={{
                animation: reduce
                  ? "none"
                  : "ncStampWrap var(--dur-slow) var(--ease-stamp) both",
              }}
            >
              <Stamp className="px-5 py-2 text-2xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
