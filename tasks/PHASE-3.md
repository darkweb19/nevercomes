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

## Slice 1 — Primitive coverage
- [ ] Button: add `secondary` variant, `lg` size, `block` prop
- [ ] Card: add `raised`, `padded` props (keep `perforated`)
- [ ] New `Eyebrow` (mono uppercase label, optional rule)
- [ ] New `Stepper` (qty −/+, value/onChange, min 1, keyboard)
- [ ] Export from `index.ts`; add to `/scratch`; `pnpm verify` green

## Slice 2 — Data layer + money util + seed options
- [ ] `lib/utils/money.ts` `formatCents` + `tests/unit/money.test.ts`
- [ ] `lib/catalog/filter.ts` (pure) + `tests/unit/filter.test.ts`
- [ ] `lib/supabase/queries.ts`: `getCategories`, `getCatalogPage`, `getProductDetail`, `getReviewsByProduct`
- [ ] Enrich a few `supabase/seed.sql` products with `options` jsonb; `pnpm db:reset`
- [ ] `pnpm verify` green

## Slice 3 — /browse (ISR + infinite scroll + filters + search)
- [ ] `app/browse/page.tsx` (Server Component, `revalidate`) + `app/browse/loading.tsx` (skeleton)
- [ ] `components/catalog/`: SiteHeader, CatalogCard, CategoryChips, SortBar, CatalogGrid, InfiniteList
- [ ] Infinite scroll via IntersectionObserver + browser supabase range queries
- [ ] Category/search(debounced)/sort filtering works
- [ ] Reduced-motion + keyboard verified
- [ ] `pnpm verify` green + browser test

## Slice 4 — /product/[id] + minimal cart store
- [ ] `lib/store/cart.ts` (minimal: lines/addLine/count — full cart is Phase 4)
- [ ] `app/product/[id]/page.tsx` (detail: gallery, info, data-driven options, reviews)
- [ ] `components/catalog/AddToCart.tsx` wires Stepper+button → store; header count reflects it
- [ ] Reduced-motion + keyboard verified
- [ ] `pnpm verify` green + browser test (add-to-cart increments count)

## Slice 5 — Polish + PR
- [ ] Final a11y/motion pass; DoD confirmed
- [ ] PR `phase-3-catalog` → `main`; CI green
