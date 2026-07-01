"use client";

/**
 * Step 02 — Payment.
 * Full theater: fields are for ceremony only. Nothing is captured, stored, or
 * transmitted. The total is $0.00 and it always has been.
 */

import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PaymentStepProps {
  onBack: () => void;
  onPlaceOrder: () => void;
  /** Deadpan inline error set if the API call fails; cleared on next attempt. */
  error: string | null;
}

export function PaymentStep({ onBack, onPlaceOrder, error }: PaymentStepProps) {
  // Theater state — never sent to anyone, never stored beyond this component.
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [saveCard, setSaveCard] = useState(false);

  return (
    <div>
      <Eyebrow>Step 02 / Payment</Eyebrow>

      <h1 className="mb-3 mt-3 font-display text-3xl font-extrabold tracking-tight text-fg-strong">
        Payment
      </h1>

      <p className="mb-8 max-w-[52ch] text-base leading-relaxed text-fg-muted">
        We&rsquo;ll go through the motions. The total is $0.00, it always has
        been.
      </p>

      <div className="max-w-[480px] space-y-5">
        {/* Card number with VOID prefix */}
        <div>
          <label
            htmlFor="card-number"
            className="mb-2 block font-mono text-2xs font-bold uppercase tracking-label text-fg-muted"
          >
            Card number
          </label>
          <div className="flex h-10 items-center rounded-md border border-hairline bg-card px-3">
            <span className="mr-2 flex-none font-mono text-xs font-bold text-fg-faint">
              VOID
            </span>
            <input
              id="card-number"
              type="text"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              autoComplete="cc-number"
              className="min-w-0 flex-1 bg-transparent font-mono text-base text-fg placeholder:text-fg-faint focus:outline-none"
            />
          </div>
        </div>

        {/* Expiry + CVC row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label
              htmlFor="expiry"
              className="mb-2 block font-mono text-2xs font-bold uppercase tracking-label text-fg-muted"
            >
              Expiry
            </label>
            <Input
              id="expiry"
              placeholder="∞ / ∞"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              autoComplete="cc-exp"
            />
          </div>
          <div className="w-[110px]">
            <label
              htmlFor="cvc"
              className="mb-2 block font-mono text-2xs font-bold uppercase tracking-label text-fg-muted"
            >
              CVC
            </label>
            <Input
              id="cvc"
              type="text"
              inputMode="numeric"
              placeholder="•••"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              autoComplete="cc-csc"
            />
          </div>
        </div>

        {/* Name on card */}
        <div>
          <label
            htmlFor="name-on-card"
            className="mb-2 block font-mono text-2xs font-bold uppercase tracking-label text-fg-muted"
          >
            Name on card
          </label>
          <Input
            id="name-on-card"
            type="text"
            placeholder="I. WON'T RECEIVE IT"
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            autoComplete="cc-name"
          />
        </div>

        {/* Save card checkbox */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="mt-[3px] h-4 w-4 flex-none rounded border border-hairline bg-card accent-accent"
          />
          <span className="font-mono text-xs text-fg-muted">
            Save this card for future orders, which also won&rsquo;t come.
          </span>
        </label>

        {/* Theater note */}
        <p className="m-0 font-mono text-2xs text-fg-faint">
          No charge will be made. We just enjoy the ceremony of the keypad.
        </p>

        {/* API error — shown if the previous placement attempt failed */}
        {error && (
          <p role="alert" className="font-mono text-2xs text-accent">
            {error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center gap-4">
        <Button variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" size="lg" onClick={onPlaceOrder}>
          Place order &middot; $0.00
        </Button>
      </div>
    </div>
  );
}
