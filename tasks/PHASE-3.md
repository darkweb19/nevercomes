# PHASE 3 — Catalog browse + product detail  [design-gated]

Build `/browse` + `/product/[id]` to the imported Claude Design (`NeverComes Web.dc.html`).
**DoD:** ≥1 page of catalog from Postgres; filters/search work; add-to-cart updates the store.
No e2e gate (full-loop e2e = Phase 8); `pnpm verify` green per slice.

Decisions (approved 2026-06-28): adopt the imported design-system tokens as source of truth;
ship both light + dark themes with a toggle, **default dark**. Fonts already wired (next/font).
Plan: `~/.claude/plans/synchronous-sprouting-yao.md`.

## Slice 0 — Token foundation + theme toggle  ✅
- [x] `app/tokens.css` — design-system semantic vars (`:root` light + `.theme-dark` carbon) + `--carbon-*` ramp; import from `app/globals.css`
- [x] `tailwind.config.ts` — `darkMode:"class"`; colors (text namespaced under `fg`) + 11–80px fontSize scale; radii low
- [x] `app/layout.tsx` — default `<html class="theme-dark">` + no-flash inline script
- [x] `components/ui/ThemeToggle.tsx` — `useSyncExternalStore` reads `.theme-dark`, persists to localStorage, a11y
- [x] Migrate Phase-1 primitives (Button/Input/Card/Badge/Sheet/Stamp) onto token aliases; update `/scratch` + add ThemeToggle
- [x] `pnpm verify` green + `pnpm build` clean (visual eyeball deferred to Slice 3 browser test)

## Slice 1 — Primitive coverage  ✅
- [x] Button: add `secondary` variant, `lg` size, `block` prop
- [x] Card: add `raised`, `padded` props (keep `perforated`)
- [x] New `Eyebrow` (mono uppercase label, optional rule)
- [x] New `Stepper` (qty −/+, value/onChange, min 1, keyboard)
- [x] Export from `index.ts`; add to `/scratch`; `pnpm verify` green

## Slice 2 — Data layer + money util + seed options  ✅
- [x] `lib/utils/money.ts` `formatCents` + `tests/unit/money.test.ts`
- [x] `lib/catalog/filter.ts` (pure: parseSort/sanitizeSearch/hasMore) + `tests/unit/filter.test.ts`
- [x] `lib/supabase/queries.ts`: `getCategories`, `getCatalogPage` (count + stable id tiebreaker), `getProductDetail`, `getReviewsByProduct`
- [x] Enrich 4 `supabase/seed.sql` products with `options` jsonb; `pnpm db:reset`
- [x] `pnpm verify` green (12 tests) + verified joins/options/pagination against local DB

## Slice 3 — /browse (ISR + infinite scroll + filters + search)  ✅
- [x] `app/browse/page.tsx` (Server Component, **static + 5m ISR** via cookieless `createPublicClient`) + `app/browse/loading.tsx` (skeleton)
- [x] `components/catalog/`: SiteHeader, CatalogCard, CategoryChips, SortBar, CatalogGrid, CatalogBrowser, ProductIcon
- [x] Infinite scroll via IntersectionObserver + browser supabase range queries
- [x] Category/search(debounced)/sort filtering (client over browser supabase)
- [x] Reduced-motion (CSS keyframes degrade) + keyboard (native buttons + focus ring)
- [x] `pnpm verify` green + `pnpm build` (ISR confirmed) + SSR content test (12 real products, hero, $0.00, chips, 0 errors). ⚠️ Interactive browser pass blocked by env chrome-blocker hook — needs manual/web-tester eyeball.

## Slice 4 — /product/[id] + minimal cart store  ✅
- [x] `lib/store/cart.ts` (minimal: lines/addLine/count — full cart is Phase 4) [done in S3]
- [x] `app/product/[id]/page.tsx` (gallery, info, data-driven options, reviews, uuid-guard → 404)
- [x] `lib/catalog/options.ts` safe jsonb parser + `tests/unit/options.test.ts` (3 tests)
- [x] `components/catalog/AddToCart.tsx` wires options + Stepper + button → `useCart().addLine`; header count reflects it
- [x] Reduced-motion (no animations added) + keyboard (native buttons, aria-pressed/checkbox) 
- [x] `pnpm verify` green (15 tests) + build + SSR content test (name/vendor/options/reviews/$0.00 + 404 guards + empty-state). ⚠️ Interactive add-to-cart click still needs manual/web-tester eyeball.

## Slice 5 — Polish + PR
- [ ] Final a11y/motion pass; DoD confirmed
- [ ] PR `phase-3-catalog` → `main`; CI green
