"use client";

import { cn } from "@/lib/utils/cn";
import { SORTS, type CatalogSort } from "@/lib/catalog/filter";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface SortBarProps {
  sort: CatalogSort;
  onSort: (s: CatalogSort) => void;
  loadedCount: number;
  totalCount: number;
}

/** Toolbar row between the category chips and the product grid. */
export function SortBar({ sort, onSort, loadedCount, totalCount }: SortBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-hairline py-3.5">
      {/* Left: counts + current sort */}
      <span className="font-mono text-xs text-fg-muted">
        Showing {loadedCount} of {totalCount} &middot; sorted by {sort}
      </span>

      {/* Right: sort buttons + filter placeholder */}
      <div className="flex items-center gap-2">
        <Eyebrow className="mr-1">Sort</Eyebrow>

        {SORTS.map((s) => {
          const isActive = s.key === sort;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSort(s.key)}
              aria-pressed={isActive}
              className={cn(
                "h-8 rounded-md border px-3 font-mono text-sm uppercase tracking-wide transition-colors",
                isActive
                  ? "border-[var(--text-strong)] text-fg-strong"
                  : "border-hairline text-fg-muted hover:text-fg-strong hover:border-[var(--text-muted)]",
              )}
            >
              {s.label}
            </button>
          );
        })}

        <Button variant="secondary" size="sm" disabled>
          Filters &middot; 0
        </Button>
      </div>
    </div>
  );
}
