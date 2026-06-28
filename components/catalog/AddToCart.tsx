"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/lib/store/cart";
import type { OptionGroup } from "@/lib/catalog/options";

interface AddToCartProps {
  productId: string;
  /** Product name, snapshotted onto the cart line for the receipt. */
  name: string;
  /** Real `price_cents` (never the $0.00 gag) — snapshotted onto the line. */
  priceCents: number;
  /** Short descriptor for the receipt line (e.g. the vendor). */
  note?: string;
  options: OptionGroup[];
}

const SOLD_OUT = "Sold out";

/**
 * Interactive options + quantity + add-to-cart for the product page.
 * Selection state lives here; on add it pushes a line into the (minimal,
 * Phase-3) cart store and shows the deadpan confirmation.
 */
export function AddToCart({
  productId,
  name,
  priceCents,
  note,
  options,
}: AddToCartProps) {
  const addLine = useCart((s) => s.addLine);

  const [selection, setSelection] = useState<Record<string, string | string[]>>(
    () => {
      const init: Record<string, string | string[]> = {};
      for (const g of options) {
        init[g.name] =
          g.kind === "single" ? (g.choices[0]?.label ?? "") : [];
      }
      return init;
    },
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function selectSingle(group: string, label: string) {
    setSelection((s) => ({ ...s, [group]: label }));
    setAdded(false);
  }

  function toggleMulti(group: string, label: string) {
    setSelection((s) => {
      const cur = Array.isArray(s[group]) ? (s[group] as string[]) : [];
      const next = cur.includes(label)
        ? cur.filter((l) => l !== label)
        : [...cur, label];
      return { ...s, [group]: next };
    });
    setAdded(false);
  }

  function handleAdd() {
    addLine({ productId, name, priceCents, note, qty, options: selection });
    setAdded(true);
  }

  return (
    <div>
      {options.map((group) => (
        <div key={group.name} className="mt-5">
          <Eyebrow>{group.name}</Eyebrow>

          {group.kind === "single" ? (
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {group.choices.map((choice) => {
                const active = selection[group.name] === choice.label;
                return (
                  <button
                    key={choice.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectSingle(group.name, choice.label)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-accent bg-accent-wash"
                        : "border-hairline hover:bg-sunken",
                    )}
                  >
                    <div className="font-mono font-bold text-base text-fg-strong">
                      {choice.label}
                    </div>
                    {choice.note && (
                      <div className="mt-0.5 font-mono text-2xs text-fg-muted">
                        {choice.note}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-2.5 flex flex-col gap-2.5">
              {group.choices.map((choice) => {
                const soldOut = choice.note === SOLD_OUT;
                const checked =
                  Array.isArray(selection[group.name]) &&
                  (selection[group.name] as string[]).includes(choice.label);
                return (
                  <button
                    key={choice.label}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={choice.label}
                    disabled={soldOut}
                    onClick={() => toggleMulti(group.name, choice.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
                      checked
                        ? "border-accent bg-accent-wash"
                        : "border-hairline",
                      soldOut
                        ? "cursor-not-allowed opacity-45"
                        : "hover:bg-sunken",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 flex-none items-center justify-center rounded-sm border",
                        checked
                          ? "border-accent bg-accent text-accent-contrast"
                          : "border-fg-faint",
                      )}
                      aria-hidden="true"
                    >
                      {checked && (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 text-base text-fg-strong">
                      {choice.label}
                    </span>
                    {choice.note && (
                      <span className="font-mono text-xs text-fg-muted">
                        {choice.note}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="mt-6 flex items-center gap-4">
        <Stepper value={qty} onChange={setQty} aria-label="Quantity" />
        <div className="flex-1">
          <Button variant="primary" size="lg" block onClick={handleAdd}>
            {added ? "Added · It begins" : "Add to cart · $0.00"}
          </Button>
        </div>
      </div>

      {added && (
        <p className="mt-3 font-mono text-xs text-accent" role="status">
          Added to a cart that resolves to $0.00. As designed.
        </p>
      )}

      <p className="mt-3.5 text-center font-mono text-2xs text-fg-faint">
        NOTHING WILL BE CHARGED. NOTHING WILL ARRIVE.
      </p>

      <div className="mt-3.5">
        <Button variant="ghost" block>
          Save for never
        </Button>
      </div>
    </div>
  );
}
