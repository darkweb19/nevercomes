"use client";

/**
 * ClaimHistoryCard — email-only upgrade form for anonymous /me sessions.
 *
 * Rendered only while the session is anonymous. Hides automatically via
 * onAuthStateChange when the user upgrades or signs out.
 *
 * State machine:
 *   idle        → form visible, no error
 *   submitting  → form visible, button disabled + "Saving…"
 *   check-inbox → success message (form replaced)
 *   error       → form visible + inline error message
 *
 * Submit flow:
 *   1. supabase.auth.updateUser({ email })
 *   2. If error indicates an existing account, fall back to signInWithOtp
 *   3. Either success → check-inbox; other failure → error state (form stays)
 *
 * D3: Google OAuth omitted — no OAuth provider configured. No "OR" divider.
 */

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type CardState = "idle" | "submitting" | "check-inbox" | "error";

export interface ClaimHistoryCardProps {
  /** Server-side hint: true when the current session is anonymous. */
  initialVisible: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ClaimHistoryCard({ initialVisible }: ClaimHistoryCardProps) {
  const [visible, setVisible] = useState(initialVisible);
  const [cardState, setCardState] = useState<CardState>("idle");
  const [emailValue, setEmailValue] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inboxHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Hide once the user is no longer anonymous or session ends.
      if (!session || !session.user.is_anonymous) {
        setVisible(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = emailValue.trim();

    if (!trimmed) {
      setErrorMsg("Enter your email address.");
      setCardState("error");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setErrorMsg("That doesn’t look like a valid email address.");
      setCardState("error");
      return;
    }

    setErrorMsg(null);
    setCardState("submitting");
    setSubmittedEmail(trimmed);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: trimmed });

    if (!error) {
      setCardState("check-inbox");
      // Defer focus so the DOM has updated.
      setTimeout(() => inboxHeadingRef.current?.focus(), 0);
      return;
    }

    // Check if this email already belongs to a permanent account.
    const errorWithCode = error as unknown as { code?: string };
    const isExistingAccount =
      /already/i.test(error.message) ||
      errorWithCode.code === "email_exists";

    if (isExistingAccount) {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: `${window.location.origin}/me` },
      });

      if (!otpError) {
        setCardState("check-inbox");
        setTimeout(() => inboxHeadingRef.current?.focus(), 0);
        return;
      }

      setErrorMsg(otpError.message);
      setCardState("error");
      return;
    }

    setErrorMsg(error.message);
    setCardState("error");
  };

  if (!visible) return null;

  const isFormVisible = cardState !== "check-inbox";

  return (
    <Card raised padded={false} id="claim-history" className="w-full max-w-[460px]">
      <div className="flex flex-col gap-[18px] p-6">
        <Eyebrow rule>Claim your history</Eyebrow>

        {/* Dynamic section — aria-live announces state transitions. */}
        <div aria-live="polite" className="flex flex-col gap-[18px]">
          {isFormVisible ? (
            <>
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-fg-strong">
                  Don&rsquo;t lose the receipt.
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  Everything already works without an account. This just keeps
                  your ledger — the ghost totals, the streak, the things that
                  never arrived — attached to you instead of this browser tab.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3.5"
                noValidate
              >
                <div>
                  <label
                    htmlFor="claim-email"
                    className="mb-2 block font-mono text-2xs font-bold uppercase tracking-label text-fg-muted"
                  >
                    Email
                  </label>
                  <Input
                    id="claim-email"
                    type="email"
                    required
                    placeholder="you@wherever.com"
                    value={emailValue}
                    onChange={(e) => {
                      setEmailValue(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                      if (cardState === "error") setCardState("idle");
                    }}
                    aria-describedby={errorMsg ? "claim-error" : undefined}
                    disabled={cardState === "submitting"}
                    autoComplete="email"
                  />
                  {/* No role="alert": the aria-live="polite" wrapper already
                      announces this, and alert would double-announce. */}
                  {errorMsg && (
                    <p
                      id="claim-error"
                      className="mt-2 font-mono text-2xs text-accent"
                    >
                      {errorMsg}
                    </p>
                  )}
                </div>

                <Button
                  variant="primary"
                  block
                  type="submit"
                  disabled={cardState === "submitting"}
                >
                  {cardState === "submitting" ? "Saving…" : "Save my history"}
                </Button>

                <p className="text-center font-mono text-[11px] text-fg-faint">
                  No password. No spam. Nothing will arrive either way.
                </p>
              </form>
            </>
          ) : (
            /* check-inbox state */
            <>
              <div>
                <h2
                  ref={inboxHeadingRef}
                  tabIndex={-1}
                  className="font-display text-2xl font-extrabold tracking-tight text-fg-strong focus-visible:outline-none"
                >
                  Check your inbox.
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  We sent a confirmation to {submittedEmail}. Click it and your
                  ledger is yours. Delivery not guaranteed — actually, this one
                  is.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCardState("idle");
                  setEmailValue("");
                  setSubmittedEmail("");
                  setErrorMsg(null);
                }}
              >
                Use a different email
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
