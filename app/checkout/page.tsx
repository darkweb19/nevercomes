"use client";

/**
 * /checkout — Phase 5 checkout UI.
 *
 * Thin shell: mounts SiteHeader + the page chrome, then delegates entirely to
 * CheckoutFlow which owns the four-step state machine (location → payment →
 * processing → done). Client component because the cart lives in localStorage.
 */

import { SiteHeader } from "@/components/catalog/SiteHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-[1100px] px-7 pb-24 pt-10">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <Eyebrow>Checkout</Eyebrow>
            <h2 className="sr-only">NeverComes Checkout</h2>
          </div>
          <span className="font-mono text-2xs text-fg-faint">
            SECURE-ISH &middot; 256-BIT THEATER
          </span>
        </div>

        {/* ── Four-step flow ───────────────────────────────────────────────── */}
        <CheckoutFlow />
      </main>
    </>
  );
}
