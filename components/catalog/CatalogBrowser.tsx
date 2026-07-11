"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getCatalogPage,
  getRegionByPrefix,
  getRegionVendors,
} from "@/lib/supabase/queries";
import type {
  CatalogProduct,
  Category,
  RegionVendor,
} from "@/lib/supabase/queries";
import {
  CATEGORY_ALL,
  hasMore,
  type CatalogSort,
} from "@/lib/catalog/filter";
import {
  DEFAULT_REGION,
  resolveBrowseRegion,
  catalogScope,
  type BrowsePhase,
} from "@/lib/catalog/region";
import { SiteHeader } from "./SiteHeader";
import { CategoryChips } from "./CategoryChips";
import { SortBar } from "./SortBar";
import { CatalogGrid } from "./CatalogGrid";
import { PreparingBanner } from "./PreparingBanner";
import { StoreReadyBanner } from "./StoreReadyBanner";
import { NearbyVendors } from "./NearbyVendors";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface CatalogBrowserProps {
  /** First page of the GLOBAL floor from the server (ISR). */
  initialItems: CatalogProduct[];
  /** Total matching count from the server (drives "X of Y"). */
  initialCount: number;
  /** All categories for chip rendering + slug→id mapping. */
  categories: Category[];
}

const PAGE_SIZE = 12;
/** How often to re-check a cold region for its freshly-generated catalog. */
const POLL_MS = 12_000;
/** How long the "your store exists now" confirmation lingers before it leaves. */
const FILL_DWELL_MS = 4_200;

const noopSubscribe = () => () => {};

/**
 * Resolve the browse region from the `?region=<FSA>` override, hydration-safely:
 * the server + first client render use DEFAULT_REGION (matching the static HTML),
 * then the client swaps in the real param. Same pattern as useCartReady.
 */
function useRegionParam(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      resolveBrowseRegion(
        new URLSearchParams(window.location.search).get("region"),
      ),
    () => DEFAULT_REGION,
  );
}

/**
 * Full catalog interactive shell. Owns filter state (category, search, sort) and
 * infinite scroll, PLUS region awareness: it resolves the visitor's FSA, decides
 * the browse phase (cold / filling / warm) from `regions.catalog_generated`, and
 * polls a cold region until its local layer lands — then settles it in.
 */
export function CatalogBrowser({
  initialItems,
  initialCount,
  categories,
}: CatalogBrowserProps) {
  // Single stable browser client for the lifetime of this mount.
  const supabase = useMemo(() => createClient(), []);

  // ── Region state ──────────────────────────────────────────────────────────
  // Default to M5V; a `?region=<FSA>` override is read client-side (keeps the
  // page static — no useSearchParams Suspense boundary needed).
  const region = useRegionParam();
  const [regionId, setRegionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<BrowsePhase>("cold");
  const [localVendors, setLocalVendors] = useState<RegionVendor[]>([]);
  const [localItemCount, setLocalItemCount] = useState<number>(0);

  // The current region query scope — global floor while cold/unknown, else
  // global + this region's local rows.
  const scope = useMemo(
    () => catalogScope(phase, regionId),
    [phase, regionId],
  );

  // ── Filter state ──────────────────────────────────────────────────────────
  const [category, setCategory] = useState<string>(CATEGORY_ALL);
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<CatalogSort>("anticipation");

  // Debounced search — updated 300ms after the raw input stops changing.
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

  // ── Region readiness: resolve + poll while cold ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    // The first resolution decides warm-vs-filling: a region already generated
    // on arrival is simply warm (no confirmation); a LATER flip is "filling".
    let firstCheck = true;

    async function check() {
      const wasFirst = firstCheck;
      firstCheck = false;

      let row: Awaited<ReturnType<typeof getRegionByPrefix>>;
      try {
        row = await getRegionByPrefix(supabase, region);
      } catch {
        return; // transient — the next poll retries
      }
      if (cancelled) return;
      setRegionId(row?.id ?? null);
      if (!row?.catalog_generated) return;

      if (timer) {
        clearInterval(timer);
        timer = null;
      }

      let vendors: RegionVendor[] = [];
      try {
        vendors = await getRegionVendors(supabase, row.id);
      } catch {
        /* leave vendors empty — the grid still widens to local + global */
      }
      if (cancelled) return;
      setLocalVendors(vendors);
      setLocalItemCount(vendors.reduce((sum, v) => sum + v.itemCount, 0));
      setPhase(wasFirst ? "warm" : "filling");
    }

    check();
    timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      check();
    }, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [region, supabase]);

  // ── "Filling" is transient — settle to warm after the confirmation lingers ─
  useEffect(() => {
    if (phase !== "filling") return;
    const t = setTimeout(() => setPhase("warm"), FILL_DWELL_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // ── Debounce ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Refetch on filter OR region-scope change ──────────────────────────────
  useEffect(() => {
    // Skip mount: the server already gave us the correct first page (the global
    // floor) for the default filters + the initial cold scope.
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
      regionScope: scope,
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
  }, [debouncedSearch, activeCategoryId, sort, scope, supabase]);

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
        regionScope: scope,
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
    scope,
  ]);

  // Keep a stable ref so the observer callback always calls the latest version.
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

  // Deadpan region sub-line for the hero.
  const regionSub =
    phase === "cold"
      ? "STORE STILL PRINTING"
      : phase === "filling"
        ? "LOCAL STORE JUST INDEXED"
        : "LOCAL STORE LIVE";

  return (
    <div className="min-h-screen bg-page">
      {/* ── Sticky site header (owns search + region pill) ────────────────── */}
      <SiteHeader
        search={search}
        onSearch={setSearch}
        region={{ prefix: region, phase }}
      />

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
            <p className="font-mono font-bold text-fg-strong">{region}</p>
            <p className="font-mono text-2xs uppercase tracking-label text-fg-faint mt-1">
              {regionSub}
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

        <div className="mt-6 flex flex-col gap-8">
          {/* Region state: preparing banner (cold) → confirmation (filling) */}
          {phase === "cold" && <PreparingBanner region={region} />}
          {phase === "filling" && (
            <StoreReadyBanner region={region} itemCount={localItemCount} />
          )}

          {/* Nearby vendors — ghosts while cold, real cards once filled */}
          <NearbyVendors phase={phase} region={region} vendors={localVendors} />

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
