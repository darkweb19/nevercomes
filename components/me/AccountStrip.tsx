"use client";

/**
 * AccountStrip — auth-state indicator for /me.
 *
 * Three visible states:
 *   anonymous      → "Claim your history" button that scrolls to + focuses the
 *                    claim card (#claim-history).
 *   signed-in      → mono email + ghost "Sign out" button.
 *   just-claimed   → Stamp "CLAIMED" + "just now" (session-local; next visit
 *                    renders the normal signed-in state).
 *
 * A fourth internal state "none" (no session) renders nothing.
 *
 * `initialEmail` / `initialIsAnonymous` are server-side hints that seed the
 * first render to prevent layout pop; onAuthStateChange keeps it live.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Stamp } from "@/components/ui/Stamp";

type StripState = "none" | "anonymous" | "signed-in" | "just-claimed";

export interface AccountStripProps {
  initialEmail: string | null;
  initialIsAnonymous: boolean;
}

function deriveInitialState(
  email: string | null,
  isAnonymous: boolean,
): StripState {
  // isAnonymous false AND email null means the page was rendered without a session.
  if (!isAnonymous && email === null) return "none";
  if (isAnonymous) return "anonymous";
  return "signed-in";
}

export function AccountStrip({
  initialEmail,
  initialIsAnonymous,
}: AccountStripProps) {
  const [state, setState] = useState<StripState>(() =>
    deriveInitialState(initialEmail, initialIsAnonymous),
  );
  const [email, setEmail] = useState<string | null>(initialEmail);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === "SIGNED_OUT") {
        setState("none");
        setEmail(null);
        return;
      }

      const user = session.user;

      // Anonymous → permanent upgrade in the same session.
      if (event === "USER_UPDATED" && !user.is_anonymous && user.email) {
        setState("just-claimed");
        setEmail(user.email);
        return;
      }

      if (user.is_anonymous) {
        setState("anonymous");
        setEmail(null);
      } else {
        setState("signed-in");
        setEmail(user.email ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /** Scroll to the claim card and focus the email input (or h2 if form gone). */
  const handleClaimClick = () => {
    const el = document.getElementById("claim-history");
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });

    const input = el.querySelector<HTMLInputElement>('input[type="email"]');
    const heading = el.querySelector<HTMLElement>("h2");
    if (input) {
      input.focus();
    } else if (heading) {
      heading.focus();
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    location.reload();
  };

  if (state === "none") return null;

  if (state === "anonymous") {
    return (
      <Button variant="secondary" size="sm" onClick={handleClaimClick}>
        Claim your history
      </Button>
    );
  }

  if (state === "just-claimed") {
    return (
      <div className="flex items-center gap-2.5">
        {/* Stamp scaled down via !important overrides — cn() has no merge. */}
        <Stamp
          label="CLAIMED"
          className="!border !px-2 !py-0.5 !text-xs"
        />
        <span className="font-mono text-[11px] text-fg-faint">just now</span>
      </div>
    );
  }

  // signed-in
  return (
    <div className="flex items-center gap-3.5">
      <span className="font-mono text-xs text-fg-muted">{email}</span>
      <span className="h-3.5 w-px flex-none bg-hairline" aria-hidden="true" />
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
