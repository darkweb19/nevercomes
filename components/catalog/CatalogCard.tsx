import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { formatCents } from "@/lib/utils/money";
import type { CatalogProduct } from "@/lib/supabase/queries";
import { ProductIcon } from "./ProductIcon";

/** Fake delivery ETAs — cycles deterministically by card index so the gag varies. */
const FAKE_ETAS = [
  "2 min",
  "7 min",
  "Never",
  "Soon",
  "47 days",
  "Recalculating…",
  "Pending",
] as const;

/**
 * Derive a product code from the card index that looks like a SKU but is fully
 * deterministic (same index → same code; no randomness).
 */
function productCode(index: number): string {
  return `NC-${((index + 1) * 431) % 9000 + 100}`;
}

interface CatalogCardProps {
  product: CatalogProduct;
  /** Position in the current result list — drives deterministic ETA + code. */
  index: number;
}

export function CatalogCard({ product, index }: CatalogCardProps) {
  const eta = FAKE_ETAS[index % FAKE_ETAS.length];
  const code = productCode(index);

  return (
    <Link
      href={`/product/${product.id}`}
      className="block rounded-md"
      aria-label={product.name}
    >
      <Card
        perforated={false}
        padded={false}
        className="overflow-hidden transition-colors hover:bg-raised"
      >
        {/* ── Image placeholder tile ───────────────────────────────────── */}
        <div
          className="relative flex h-[152px] items-center justify-center"
          style={{
            background: [
              "radial-gradient(120% 90% at 82% 12%, rgba(200,70,58,0.16), rgba(200,70,58,0) 60%)",
              "repeating-linear-gradient(0deg, transparent 0 21px, rgba(255,255,255,0.035) 21px 22px)",
              "repeating-linear-gradient(90deg, transparent 0 21px, rgba(255,255,255,0.035) 21px 22px)",
              "var(--carbon-800)",
            ].join(", "),
          }}
          aria-hidden="true"
        >
          <ProductIcon categorySlug={product.category?.slug} />

          {/* Bottom-left product code */}
          <span className="absolute bottom-2 left-2 font-mono text-[9px] text-fg-faint">
            {code}
          </span>
        </div>

        {/* ── Card body ────────────────────────────────────────────────── */}
        <div className="p-4">
          <Eyebrow className="mb-1">
            {product.vendor?.name ?? "Unknown Vendor"}
          </Eyebrow>

          <p className="mb-2 font-display font-bold text-md text-fg-strong leading-snug">
            {product.name}
          </p>

          {/* Rating + ETA row */}
          <div className="mb-3 flex items-center gap-2 font-mono text-xs text-fg-muted">
            <span className="text-accent">&#x22C6; {product.rating.toFixed(1)}</span>
            <span aria-hidden="true">·</span>
            <span>{eta}</span>
          </div>

          {/* Perforation divider */}
          <div className="perforation mb-3" aria-hidden="true" />

          {/* Price row */}
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-fg-faint line-through">
              {formatCents(product.price_cents, product.currency)}
            </span>
            <span className="font-mono font-bold text-md text-fg-strong">
              $0.00
            </span>
            <span className="ml-auto font-mono text-xs text-fg-faint">CAD</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
