# PHASE 1 — Design tokens → Tailwind + UI primitives

Wire the **ready** design system (`.claude/knowledge/design.md`) into the build and create the
`components/ui` primitives. **Not design-gated** (uses the design *system*, not a screen layout).
**DoD:** primitives render with real tokens; fonts loaded; reviewed on `/scratch`.

Pre-req confirmed: **Phase 0 DoD met** — `pnpm verify` green (typecheck + lint + 1 unit test),
structure matches architecture, `components/ui/` empty.

## Decisions (confirm or correct before I implement)

- **D1 — `cn` helper, zero-dep.** Add `lib/utils/cn.ts` as a tiny `clsx`-style joiner (no
  `clsx`/`tailwind-merge` deps). We can upgrade to `tailwind-merge` later if class-conflict
  resolution becomes necessary. Keeps the presentational layer dependency-free.
- **D2 — Defer the component-test harness.** No `@testing-library/react` / jsdom / react plugin
  exists, and vitest runs in `node`. Phase 1 DoD is visual review, and `rules/testing.md` scopes
  *Component* tests to the cart drawer / checkout $0.00 / never-arrived stamp (Phases 4/5/7). I'll
  stand the harness up in the first phase that needs a **required** component test, not here.
  Phase 1 `verify` = typecheck + lint + existing unit test (stays green).
- **D3 — `/scratch`, not `/_scratch`.** Next.js App Router treats `_`-prefixed folders as private
  (non-routable), so `execution-phases.md`'s `/_scratch` can't be a literal route. Using
  `app/scratch/page.tsx` → `/scratch`. (Flagging the deviation per design rule #4.)
- **D4 — Body font = display (Bricolage Grotesque).** `design.md` names only two families
  (display + mono). Body copy will default to the display sans; `mono` is applied explicitly on
  receipt/tracking-flavored text (prices, IDs, ETAs, status). Tailwind `font-sans` → display var.

---

## 1. Tokens → `tailwind.config.ts` (`theme.extend`)
- [ ] **colors:** `paper #E9E6DC`, `paper-2 #F3F1EA`, `ink #18181B`, `ink-faded #7C766B`,
      `stamp #A81F2D`, `rule rgba(24,24,27,0.15)`, `ok #2F7D55`, `warn #E0A82E`.
- [ ] **fontFamily:** `display: var(--font-display)`, `mono: var(--font-mono)`, and point
      `sans → var(--font-display)` so body text uses Bricolage (D4).
- [ ] **fontSize:** the scale `12 / 14 / 16 / 20 / 28 / 40 / 56` as named keys
      (`micro 12, label 14, body 16, lg 20, h3 28, h2 40, h1 56`), added via `extend` (defaults kept).
- [ ] **borderRadius:** `sm 4px · md 8px · lg 12px` (crisp receipts).
- [ ] **spacing:** none added — design's `4/8/12/16/24/32/48/64` already map to Tailwind
      `1,2,3,4,6,8,12,16`. Note in a comment.

## 2. Fonts → `app/layout.tsx`
- [ ] Replace Geist with `Bricolage_Grotesque` (display, variable) + `Space_Mono`
      (mono, weights 400/700) via `next/font/google`.
- [ ] Expose `--font-display` and `--font-mono`; set them on `<html>`.
- [ ] Update `<body>` base classes to `bg-paper text-ink` + default sans.

## 3. Base styles → `app/globals.css`
- [ ] `@layer base`: body background/ink/font; visible **`:focus-visible`** ring in `stamp`
      (a11y); `prefers-reduced-motion: reduce` disables transitions/animations globally.
- [ ] `@layer components`: a `.perforation` utility (1px dashed top edge in `rule`) for Card +
      future dividers/route motif.

## 4. Primitives → `components/ui/`  (presentational only; side effects live in hooks)
- [ ] `cn.ts` → actually `lib/utils/cn.ts` (D1).
- [ ] `Button.tsx` — variants `primary` (bg-stamp / paper text) & `ghost` (ink + rule border);
      sizes sm/md; `forwardRef`, `focus-visible` ring, disabled state, `type="button"` default.
- [ ] `Input.tsx` — `paper-2` field, mono text, `rule` border, focus ring, `forwardRef`.
- [ ] `Card.tsx` — `paper-2` surface, `.perforation` top edge, radius `md`, padding.
- [ ] `Badge.tsx` — small mono uppercase label; variants `default / ok / warn / stamp`.
- [ ] `Sheet.tsx` — `"use client"` controlled drawer (`open`, `onOpenChange`): overlay, slide-in
      panel, **Esc to close**, focus moved into panel, reduced-motion → no slide. Keyboard-safe.
- [ ] `Stamp.tsx` — rotated "NEVER ARRIVED" rubber-stamp mark in `stamp`, low-ink border; static
      (no animation) so reduced-motion is a no-op.
- [ ] `index.ts` — barrel export of the primitives.

## 5. Visual review page → `app/scratch/page.tsx`  (D3)
- [ ] Render every primitive + variant on `bg-paper`: type scale specimen, color swatches,
      Buttons, Input, Card, Badges, a Sheet trigger, and the Stamp. For eyeballing only.

## 6. Verify (proves it done)
- [ ] `pnpm verify` green (typecheck + lint + existing unit test).
- [ ] `pnpm dev` → open `/scratch`: fonts load (Bricolage + Space Mono), tokens render, **Tab**
      through Button/Input/Sheet shows visible focus, Sheet opens/closes via keyboard, OS
      reduced-motion kills the slide. (Manual — this is the DoD's "eyeballed".)
- [ ] No e2e (core loop untouched).

## 7. Commit
- [ ] Branch `phase-1-design-tokens`; small commits; PR into `main` using the template, `Closes #1`.

## Out of scope (guard against creep)
Any real screen (browse/cart/checkout/tracker), MapLibre, data/migrations, component-test
harness, `tailwind-merge`/CVA. Primitives only.
