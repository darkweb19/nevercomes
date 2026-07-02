"use client";

/**
 * StatusTimeline — the 5-row courier progress list.
 *
 * Rows: Accepted · Preparing · Picked up · Nearby · Delivered.
 * The "Delivered" row is the payoff: it is always in state "never" — dashed
 * stamp-600 ring, stamp-400 meta "—". No sim status can make it done or active.
 *
 * Row states are passed in from the caller (computed via statusToRowStates in
 * display.ts). The component is purely presentational.
 */

import type { TimelineRowStates, RowState } from "./display";

// ── TimelineRow primitive ────────────────────────────────────────────────────

interface TimelineRowProps {
  label: string;
  meta: string;
  state: RowState;
  /** When true, suppresses the dashed connector below this row. */
  isLast?: boolean;
}

function TimelineRow({ label, meta, state, isLast = false }: TimelineRowProps) {
  const done = state === "done";
  const active = state === "active";
  const never = state === "never";

  const dotBg = done
    ? "var(--text-strong)"
    : active
      ? "var(--accent)"
      : "transparent";

  const dotRing = done
    ? "var(--text-strong)"
    : active
      ? "var(--accent)"
      : never
        ? "var(--stamp-600)"
        : "var(--border-perf)";

  const dotStyle: React.CSSProperties = {
    width: 13,
    height: 13,
    borderRadius: "999px",
    background: dotBg,
    border: `2px ${never ? "dashed" : "solid"} ${dotRing}`,
    flex: "none",
    marginTop: 3,
    boxShadow: active ? "0 0 0 4px var(--accent-wash)" : "none",
  };

  const connectorColor = done ? "var(--text-faint)" : "var(--border-perf)";

  const labelColor = never
    ? "var(--text-faint)"
    : active
      ? "var(--text-strong)"
      : done
        ? "var(--text-body)"
        : "var(--text-faint)";

  const metaColor = never ? "var(--stamp-400)" : "var(--text-muted)";

  return (
    <div style={{ display: "flex", gap: 13, alignItems: "stretch" }}>
      {/* Dot + connector column */}
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <span style={dotStyle} />
        {!isLast && (
          <span
            style={{
              flex: 1,
              width: 0,
              borderLeft: `2px dashed ${connectorColor}`,
              minHeight: 13,
              margin: "3px 0",
            }}
          />
        )}
      </div>

      {/* Label + meta column */}
      <div style={{ paddingBottom: isLast ? 0 : 9, flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "var(--text-sm, 13px)",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: labelColor,
            lineHeight: 1.1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-2xs, 11px)",
            letterSpacing: "0.04em",
            color: metaColor,
            marginTop: 3,
          }}
        >
          {meta}
        </div>
      </div>
    </div>
  );
}

// ── StatusTimeline ────────────────────────────────────────────────────────────

export interface StatusTimelineProps {
  rowStates: TimelineRowStates;
  /** Accepted timestamp (e.g. "12:02 AM"). */
  acceptedTime: string;
  /** Picked-up timestamp (e.g. "12:41 AM"). */
  pickedUpTime: string;
  /** Vendor / restaurant name for the Preparing row meta. */
  vendorName: string;
}

/**
 * Five-row timeline: Accepted, Preparing, Picked up, Nearby, Delivered.
 * The Delivered row is always "never" — the payoff of the whole gag.
 */
export function StatusTimeline({
  rowStates,
  acceptedTime,
  pickedUpTime,
  vendorName,
}: StatusTimelineProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <TimelineRow
        label="Accepted"
        meta={acceptedTime}
        state={rowStates.accepted}
      />
      <TimelineRow
        label="Preparing"
        meta={vendorName}
        state={rowStates.preparing}
      />
      <TimelineRow
        label="Picked up"
        meta={pickedUpTime}
        state={rowStates.picked_up}
      />
      <TimelineRow
        label="Nearby"
        meta="holding · 2 streets"
        state={rowStates.nearby}
      />
      <TimelineRow
        label="Delivered"
        meta="—"
        state={rowStates.delivered}
        isLast
      />
    </div>
  );
}
