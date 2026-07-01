"use client";

/**
 * CheckoutFlow — four-step state machine for /checkout.
 *
 * Steps: location → payment → processing → done
 *
 * Layout:
 *   location / payment:  form (left flex-[3]) + sticky OrderSummary (right flex-[1])
 *   processing:          centered thermal-slip animation (full width)
 *   done:                DoneStep content (left flex-[3]) + DoneReceipt (right flex-[1])
 *
 * Hydration: gated on useCartReady() — same pattern as /cart — so cart-derived
 * rendering never mismatches the server's empty render.
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cart";
import { useCartReady } from "@/lib/store/useCartReady";
import { computeTotals } from "@/lib/cart/totals";
import { ensureAnonSession } from "@/lib/supabase/ensure-session";
import { Button } from "@/components/ui/Button";

import { StepRail, type Step } from "./StepRail";
import { OrderSummary } from "./OrderSummary";
import { DoneReceipt, type ReceiptSnapshot } from "./DoneReceipt";
import { LocationStep } from "./LocationStep";
import { PaymentStep } from "./PaymentStep";
import { ProcessingStep } from "./ProcessingStep";
import { DoneStep } from "./DoneStep";

const MIN_DWELL_MS = 2000;
const ERROR_DWELL_MS = 1500;

export function CheckoutFlow() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const ready = useCartReady();

  const [step, setStep] = useState<Step>("location");
  const [postalCode, setPostalCode] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiptSnapshot, setReceiptSnapshot] = useState<ReceiptSnapshot | null>(null);
  /** Set once the API responds (may arrive before the 2s dwell expires). */
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const onLocationContinue = useCallback((postal: string) => {
    setPostalCode(postal);
    setStep("payment");
  }, []);

  const onPaymentBack = useCallback(() => setStep("location"), []);

  const onPlaceOrder = useCallback(async () => {
    setStep("processing");
    setProcessingOrderId(null);
    setError(null);
    const t0 = Date.now();

    // Snapshot the totals now — cart will be cleared after placement.
    const totals = computeTotals(lines);
    const snapshot: ReceiptSnapshot = {
      count: totals.count,
      ghostTotalCents: totals.ghostTotalCents,
    };

    const items = lines.map((l) => ({
      productId: l.productId,
      qty: l.qty,
      priceCents: l.priceCents,
      options: l.options,
    }));

    try {
      await ensureAnonSession();

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode, items }),
      });

      const data = (await res.json()) as { orderId?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      const newId = data.orderId!;
      setProcessingOrderId(newId);

      // Ensure the processing theater plays for at least MIN_DWELL_MS.
      const elapsed = Date.now() - t0;
      if (elapsed < MIN_DWELL_MS) {
        await new Promise<void>((r) => setTimeout(r, MIN_DWELL_MS - elapsed));
      }

      setOrderId(newId);
      setReceiptSnapshot(snapshot);
      clear();
      setStep("done");
    } catch (err) {
      // Brief dwell so the processing screen doesn't flash on fast errors.
      const elapsed = Date.now() - t0;
      if (elapsed < ERROR_DWELL_MS) {
        await new Promise<void>((r) => setTimeout(r, ERROR_DWELL_MS - elapsed));
      }
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setStep("payment");
    }
  }, [lines, postalCode, clear]);

  const onViewTracking = useCallback(() => {
    if (orderId) router.push(`/track/${orderId}`);
  }, [orderId, router]);

  const onOrderAgain = useCallback(() => {
    setStep("location");
    setPostalCode("");
    setOrderId(null);
    setError(null);
    setReceiptSnapshot(null);
    setProcessingOrderId(null);
  }, []);

  // ── Empty state check — gated on `ready` so it never fires on SSR ────────
  // On SSR: ready=false → isActuallyEmpty=false → full form renders (H1 in HTML ✓).
  // After hydration: if cart is empty at location step, swap to empty state.
  // This avoids the hydration mismatch that an early `!ready` shell would cause.
  const isActuallyEmpty = ready && lines.length === 0 && step === "location";

  // ── Derived display value ──────────────────────────────────────────────────
  const displayId = processingOrderId ?? orderId;
  const orderIdShort = displayId
    ? `NC-${displayId.replace(/-/g, "").slice(0, 6).toUpperCase()}`
    : null;

  const totals = computeTotals(lines);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isActuallyEmpty) {
    return (
      <div className="pt-6 text-center">
        <p className="mb-6 text-base text-fg-muted">Nothing to check out.</p>
        <Link href="/browse">
          <Button variant="secondary" size="md">
            Browse anyway
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <StepRail step={step} />

      {step === "processing" && (
        <ProcessingStep orderIdShort={orderIdShort} />
      )}

      {step === "done" && (
        <div className="flex flex-wrap items-start gap-8">
          <DoneStep
            orderId={orderId!}
            orderIdShort={orderIdShort ?? "NC-??????"}
            onViewTracking={onViewTracking}
            onOrderAgain={onOrderAgain}
          />
          <aside className="max-w-[380px] flex-[1_1_280px]">
            <DoneReceipt
              orderIdShort={orderIdShort ?? "NC-??????"}
              receiptSnapshot={receiptSnapshot}
            />
          </aside>
        </div>
      )}

      {(step === "location" || step === "payment") && (
        <div className="flex flex-wrap items-start gap-8">
          {/* Left: active step form */}
          <div className="min-w-0 flex-[3_1_520px]">
            {step === "location" && (
              <LocationStep
                postalCode={postalCode}
                onChange={setPostalCode}
                onContinue={onLocationContinue}
              />
            )}
            {step === "payment" && (
              <PaymentStep
                onBack={onPaymentBack}
                onPlaceOrder={onPlaceOrder}
                error={error}
              />
            )}
          </div>

          {/* Right: sticky order summary receipt — gated on ready so the
              sidebar only appears after hydration (prevents a flash of the
              empty receipt before localStorage is read). */}
          {ready && lines.length > 0 && (
            <aside className="sticky top-[88px] max-w-[380px] flex-[1_1_280px]">
              <OrderSummary lines={lines} totals={totals} />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
