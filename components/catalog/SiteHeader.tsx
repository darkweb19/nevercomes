"use client";

import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { useCartReady } from "@/lib/store/useCartReady";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface SiteHeaderProps {
  /**
   * Current search string. When provided together with `onSearch`, the header
   * renders a controlled search input. Omit both on pages that don't support
   * search (header still renders, search box is hidden).
   */
  search?: string;
  onSearch?: (value: string) => void;
}

/**
 * Site-wide sticky header. Self-contained client component — reads cart count
 * from Zustand and optionally hosts the catalog search input.
 *
 * Reused across browse + product pages; pass `search`/`onSearch` only on browse.
 */
export function SiteHeader({ search, onSearch }: SiteHeaderProps) {
  // Selector returns the count number directly; re-renders only when count changes.
  // Show 0 until the persisted cart has rehydrated, so the first client render
  // matches the (empty) server render and React doesn't flag a hydration mismatch.
  const ready = useCartReady();
  const count = useCart((s) => (ready ? s.count() : 0));
  const openDrawer = useCart((s) => s.openDrawer);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-page">
      <div className="flex items-center gap-4 px-12 py-[18px]">
        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link
          href="/"
          className="flex flex-none items-center gap-3"
          aria-label="NeverComes home"
        >
          <div
            className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded border-2 border-accent"
            style={{ transform: "rotate(-6deg)" }}
            aria-hidden="true"
          >
            <span className="font-mono font-bold text-accent text-sm leading-none">
              N
            </span>
          </div>
          <span className="font-mono font-bold text-xs text-fg-strong tracking-label">
            NEVERCOMES
          </span>
        </Link>

        {/* ── Search (conditional) ──────────────────────────────────────── */}
        {onSearch !== undefined && (
          <div className="flex-1" style={{ maxWidth: "560px" }}>
            <Input
              type="search"
              placeholder="Search for something you'll never receive"
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search catalog"
            />
          </div>
        )}

        {/* ── Right cluster ─────────────────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-3">
          <span
            className="hidden font-mono text-xs text-fg-faint sm:block"
            aria-hidden="true"
          >
            24/7 &middot; CA
          </span>

          {/* Cart button */}
          <button
            type="button"
            onClick={openDrawer}
            className="flex h-9 items-center gap-2 rounded-md border border-hairline bg-card px-3 font-mono text-xs uppercase tracking-label text-fg-strong transition-colors hover:bg-sunken"
            aria-label={`Cart, ${count} item${count !== 1 ? "s" : ""}`}
          >
            {/* Shopping bag icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            CART &middot; {count}
          </button>

          {/* Avatar placeholder */}
          <div
            className="flex h-9 w-9 flex-none items-center justify-center rounded-pill border border-hairline bg-sunken font-mono text-xs text-fg-muted"
            aria-label="Account"
            role="img"
          >
            NC
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
