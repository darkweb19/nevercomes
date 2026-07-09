"use client";

/**
 * ShareWait — "Share your wait" card (Phase 10, Screen 3).
 *
 * Renders a ~420px card with a display-font title, mono subtitle, and a
 * share button. On click: copies the self-contained /w share URL to the
 * clipboard and shows a deadpan "Link copied. As predicted." confirmation
 * that reverts to idle after 4 s.
 *
 * Design source: /tmp/nc-design/viral-surfaces.html §s3 "Share your wait"
 * Decision D13: the fade-in on the copied state is motion-safe: only.
 * Decision D14 (for /me callers): seed = substr(md5(profile_id), 0, 12).
 */

import { useEffect, useRef, useState } from "react";
import { buildSharePath } from "@/lib/viral/share";
import type { SharePayload } from "@/lib/viral/share";

// ── Props ────────────────────────────────────────────────────────────────────

export interface ShareWaitProps {
  payload: SharePayload;
  /** Bold display-font title, e.g. "Order #NC-4471" or "Your wait". */
  title: string;
  /** Mono muted subtitle, e.g. "In transit for 47 days". */
  subtitle: string;
}

// ── Icons ────────────────────────────────────────────────────────────────────

/** Upload/share icon: arrow-out-of-box. Exact SVG from the design. */
function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

/** Checkmark — stroke accent, width 2.5. */
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

const REVERT_DELAY_MS = 4_000;

export function ShareWait({ payload, title, subtitle }: ShareWaitProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the revert timer on unmount to avoid setState on unmounted component.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleShare() {
    const url = window.location.origin + buildSharePath(payload);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable or denied — no-op; UI stays in idle state.
      return;
    }

    setCopied(true);

    // Clear any existing timer before scheduling a new one (handles rapid clicks).
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, REVERT_DELAY_MS);
  }

  return (
    /* ~420px card: surface-card, hairline border, radius 4 (default), padding 20 */
    <div className="rounded bg-card border border-hairline p-5">
      {/* Title — display font, bold, 15px */}
      <div className="font-display font-bold text-base text-fg-strong leading-snug mb-0.5">
        {title}
      </div>

      {/* Subtitle — mono, 11px (text-2xs), muted */}
      <div className="font-mono text-2xs text-fg-muted mb-4">
        {subtitle}
      </div>

      {/*
       * aria-live="polite" region: announces the copied confirmation to screen
       * readers without interrupting current speech (polite, not assertive).
       * No role="alert" — that would double-announce alongside aria-live.
       */}
      <div aria-live="polite">
        {copied ? (
          /* Copied state: accent border + accent-wash bg + check + label */
          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm border text-accent bg-accent-wash border-accent motion-safe:[animation:ncFadeIn_var(--dur-base)_var(--ease-out)_both]"
            style={{ borderWidth: "1.5px" }}
          >
            <CheckIcon />
            <span className="font-mono font-bold text-xs uppercase tracking-label">
              Link copied. As predicted.
            </span>
          </div>
        ) : (
          /* Idle state: full-width outline button */
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-sm border border-hairline bg-transparent text-fg-strong font-mono font-bold text-xs uppercase tracking-label cursor-pointer transition-colors hover:bg-sunken"
            style={{ borderWidth: "1.5px" }}
          >
            <ShareIcon />
            Share your wait
          </button>
        )}
      </div>
    </div>
  );
}
