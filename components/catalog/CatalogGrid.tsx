import type { CatalogProduct } from "@/lib/supabase/queries";
import { CatalogCard } from "./CatalogCard";

interface CatalogGridProps {
  products: CatalogProduct[];
  /**
   * Offset to add to each card's index so deterministic codes / ETAs stay
   * correct when the grid is seeded with a second page that starts at item 12.
   */
  startIndex?: number;
}

export function CatalogGrid({ products, startIndex = 0 }: CatalogGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="font-mono text-sm text-fg-muted">
          Nothing matches. It wouldn&apos;t have arrived anyway.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map((product, i) => (
        <CatalogCard
          key={product.id}
          product={product}
          index={startIndex + i}
        />
      ))}
    </div>
  );
}
