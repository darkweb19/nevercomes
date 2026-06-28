"use client";

import { cn } from "@/lib/utils/cn";
import { CATEGORY_ALL } from "@/lib/catalog/filter";
import type { Category } from "@/lib/supabase/queries";

interface CategoryChipsProps {
  categories: Category[];
  active: string;
  onChange: (slug: string) => void;
}

/** Horizontal scrolling pill-button row for category filtering. */
export function CategoryChips({
  categories,
  active,
  onChange,
}: CategoryChipsProps) {
  const chips = [
    { id: CATEGORY_ALL, name: "All", slug: CATEGORY_ALL },
    ...categories,
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="group"
      aria-label="Filter by category"
    >
      {chips.map((cat) => {
        const isActive = cat.slug === active;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.slug)}
            aria-pressed={isActive}
            className={cn(
              "flex-none whitespace-nowrap rounded-pill px-4 py-2",
              "font-mono font-bold text-2xs uppercase tracking-label",
              "border transition-colors",
              !isActive &&
                "border-hairline bg-transparent text-fg-muted hover:text-fg-strong hover:border-[var(--text-muted)]",
            )}
            style={
              isActive
                ? {
                    backgroundColor: "var(--text-strong)",
                    color: "var(--surface-page)",
                    borderColor: "var(--text-strong)",
                  }
                : undefined
            }
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
