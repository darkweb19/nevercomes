"use client";

/**
 * Step 01 — Delivery / Location.
 * Collects a postal code (the only real data we take) with deadpan copy and
 * inline validation. Calls onContinue when the value passes the length check.
 */

import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface LocationStepProps {
  postalCode: string;
  onChange: (value: string) => void;
  onContinue: (postalCode: string) => void;
}

export function LocationStep({
  postalCode,
  onChange,
  onContinue,
}: LocationStepProps) {
  const [error, setError] = useState<string | null>(null);

  /** Non-whitespace character count — the real signal for a "valid" postal code. */
  const nonSpaceLen = postalCode.replace(/\s/g, "").length;
  const isValid = nonSpaceLen >= 3;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.toUpperCase());
    setError(null); // clear error on keystroke
  };

  const handleContinue = () => {
    if (!postalCode.trim()) {
      setError("Enter a postal code. It’s the one thing we do collect.");
      return;
    }
    if (!isValid) {
      setError("That isn’t a postal code we can fail to deliver to.");
      return;
    }
    setError(null);
    onContinue(postalCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleContinue();
  };

  return (
    <div>
      <Eyebrow>Step 01 / Delivery</Eyebrow>

      <h1 className="mb-3 mt-3 font-display text-3xl font-extrabold tracking-tight text-fg-strong">
        Where won&rsquo;t it arrive?
      </h1>

      <p className="mb-8 max-w-[48ch] text-base leading-relaxed text-fg-muted">
        Just a postal code, so we can be specific about where it won&rsquo;t
        arrive.
      </p>

      <div className="max-w-[320px]">
        <label
          htmlFor="postal-code"
          className="mb-2 block font-mono text-2xs font-bold uppercase tracking-label text-fg-muted"
        >
          Postal code
        </label>
        <Input
          id="postal-code"
          name="postalCode"
          placeholder="A1A 1A1"
          value={postalCode}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete="postal-code"
          aria-describedby={
            error
              ? "postal-error"
              : isValid && postalCode.trim()
                ? "postal-ok"
                : undefined
          }
          className="uppercase tracking-widest"
        />

        {/* Error message */}
        {error && (
          <p
            id="postal-error"
            role="alert"
            className="mt-2 font-mono text-2xs text-accent"
          >
            {error}
          </p>
        )}

        {/* Ok hint — shows when valid and no error is displayed */}
        {!error && isValid && postalCode.trim().length > 0 && (
          <p
            id="postal-ok"
            className="mt-2 font-mono text-2xs text-fg-faint"
          >
            Noted. We will not be using this.
          </p>
        )}
      </div>

      <div className="mt-8">
        <Button variant="primary" size="lg" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
