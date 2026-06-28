"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCatalogPage } from "@/lib/supabase/queries";
import type { CatalogProduct, Category } from "@/lib/supabase/queries";
import {
  CATEGORY_ALL,
  hasMore,
  type CatalogSort,
} from "@/lib/catalog/filter";
import { SiteHeader } from "./SiteHeader";
import { CategoryChips } from "./CategoryChips";
import { SortBar } from "./SortBar";
import { CatalogGrid } from "./CatalogGrid";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface CatalogBrowserProps {
  /** First page of products from the server (ISR). */
  initialItems: CatalogProduct[];
  /** Total matching count from the server (drives "X of Y"). */
  initialCount: number;
  /** All categories for chip rendering + slug→id mapping. */
  categories: Category[];
}

const PAGE_SIZE = 12;

/**
 * Full catalog interactive shell. Owns all filter state (category, search,
 * sort), does client-side refetches on change, and handles infinite scroll via
 * IntersectionObserver. Seeded with ISR server data so first paint is instant.
 */
export function CatalogBrowser({
  initialItems,
  initialCount,
  categories,
}: CatalogBrowserProps) {
  // Single stable browser client for the lifetime of this mount.
  const supabase = useMemo(() => createClient(), []);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [category, setCategory] = useState<string>(CATEGORY_ALL);
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<CatalogSort>("anticipation");

  // Debounced search — updated 300ms after the raw input stops changing.
  // setState is called inside a setTimeout callback (async), not synchronously
  // in the effect body.
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // ── Data state — lazy initializers avoid a redundant first-render fetch ───
  const [items, setItems] = useState<CatalogProduct[]>(() => initialItems);
  const [count, setCount] = useState<number>(() => initialCount);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Skip the very first filter-effect run so we keep the server-rendered data.
  const isFirstRender = useRef(true);

  // Sentinel element that the IntersectionObserver watches.
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Derived: active category UUID (null = all) ────────────────────────────
  const activeCategoryId = useMemo<string | null>(() => {
    if (category === CATEGORY_ALL) return null;
    return categories.find((c) => c.slug === category)?.id ?? null;
  }, [category, categories]);

  // ── Debounce ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Refetch on filter change ──────────────────────────────────────────────
  useEffect(() => {
    // Skip mount: the server already gave us the correct first page for the
    // default filters (all / "" / anticipation).
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let cancelled = false;

    setLoading(true);

    getCatalogPage(supabase, {
      limit: PAGE_SIZE,
      offset: 0,
      categoryId: activeCategoryId,
      search: debouncedSearch || null,
      sort,
    })
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
          setCount(result.count);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, activeCategoryId, sort, supabase]);

  // ── Load-more (append next page) ─────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore(items.length, count)) return;

    setLoadingMore(true);
    try {
      const result = await getCatalogPage(supabase, {
        limit: PAGE_SIZE,
        offset: items.length,
        categoryId: activeCategoryId,
        search: debouncedSearch || null,
        sort,
      });
      setItems((prev) => [...prev, ...result.items]);
      setCount(result.count);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    loading,
    items.length,
    count,
    supabase,
    activeCategoryId,
    debouncedSearch,
    sort,
  ]);

  // Keep a stable ref so the observer callback always calls the latest version.
  // Assigned inside an effect (not during render) to satisfy react-hooks/refs.
  const loadMoreRef = useRef(loadMore);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // ── IntersectionObserver (set up once, ref is always current) ────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreRef.current();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []); // Intentionally empty: observer is stable; loadMoreRef is a ref (stable).

  const showScrollFooter = hasMore(items.length, count) && !loading;

  return (
    <div className="min-h-screen bg-page">
      {/* ── Sticky site header (owns search state via props) ─────────────── */}
      <SiteHeader search={search} onSearch={setSearch} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-12 py-9">
        <div className="mx-auto flex max-w-[1400px] items-start justify-between">
          <div className="max-w-[600px]">
            <Eyebrow className="mb-4">Open 24/7 &middot; Nothing in stock</Eyebrow>
            <h1 className="mb-4 max-w-[17ch] font-display font-extrabold text-5xl tracking-tight text-fg-strong">
              What are you not getting tonight?
            </h1>
            <p className="text-base text-fg-muted">
              Browse freely. Add freely. Track endlessly. It all ends in the
              same place.
            </p>
          </div>

          <div className="hidden text-right md:block">
            <p className="font-mono text-2xs uppercase tracking-label text-fg-muted mb-1">
              Delivering To
            </p>
            <p className="font-mono font-bold text-fg-strong">Toronto &middot; ON</p>
            <p className="font-mono text-2xs uppercase tracking-label text-fg-faint mt-1">
              12,418 PLACES &middot; 0 WILL ARRIVE
            </p>
          </div>
        </div>
      </section>

      {/* ── Category chips ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1400px] px-12 pb-4">
        <CategoryChips
          categories={categories}
          active={category}
          onChange={(slug) => {
            setCategory(slug);
          }}
        />
      </div>

      {/* ── Main catalog area ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1400px] px-12 pb-12">
        <SortBar
          sort={sort}
          onSort={setSort}
          loadedCount={items.length}
          totalCount={count}
        />

        <div className="mt-6">
          {loading ? (
            /* Filter-reset spinner */
            <div className="flex items-center justify-center py-20">
              <div
                className="h-[34px] w-[34px] rounded-pill border-2 border-dashed border-accent"
                style={{ animation: "ncspin 2.2s linear infinite" }}
                role="status"
                aria-label="Loading catalog"
              />
            </div>
          ) : (
            <CatalogGrid products={items} />
          )}
        </div>

        {/* ── Infinite-scroll sentinel + footer ────────────────────────── */}
        <div ref={sentinelRef} className="mt-8">
          {showScrollFooter && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div
                className="h-[34px] w-[34px] rounded-pill border-2 border-dashed border-accent"
                style={{ animation: "ncspin 2.2s linear infinite" }}
                aria-hidden="true"
              />
              <Eyebrow>Loading more things that won&apos;t arrive&hellip;</Eyebrow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
