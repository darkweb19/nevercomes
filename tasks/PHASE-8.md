# Phase 8 — Landing + end-to-end  [design-gated: design PROVIDED 2026-07-03]

Design: Claude Design project `ba335fe4-ecf0-4e13-b966-32a8ba162278`, `NeverComes Landing.dc.html`
(saved decoded to `/tmp/nc-design/landing.html`). Hero direction: **split** (design default).
Branch: `phase-8-landing`. Sujan authorized start + parallel Sonnet/Haiku subagents per section.

## Slice 1 — landing sections (parallel subagents, one section group each)
- [ ] A (Sonnet): `components/landing/LandingHeader.tsx`, `Hero.tsx`, `TrackerTeaser.tsx`
      (+ `EtaCycle` client bit). Sticky header, split hero, SVG teaser map with SMIL courier;
      reduced-motion → static frame (no SMIL/CSS animation).
- [ ] B (Sonnet): `components/landing/HowItWorks.tsx`, `TheIdea.tsx` (server components, static).
- [ ] C (Haiku): `components/landing/SocialProof.tsx` (stats strip + live "orders never arriving"
      counter as a small client component), `ClosingCta.tsx`, `LandingFooter.tsx`.
- Constraints for all: tokens from `app/tokens.css` only; primitives from `components/ui`
  (Button, Card, StatusPill, Stamp, Eyebrow, Perforation); no new deps; no `lib/sim` imports;
  server components except where state/interval is needed; CTAs link: Start a fake order → /browse,
  How it (doesn't) work → #how, Track an order → /me (orders); keyboard/focus + aria intact.

## Slice 2 — page assembly (me)
- [ ] `app/page.tsx` ← compose sections (replace scaffold), anchors #top/#how/#idea/#proof,
      metadata; `npm run verify` + `npm run build` green.

## Slice 3 — e2e: the full anonymous loop (me)
- [ ] Replace `tests/e2e/smoke.spec.ts` stub: landing → /browse → product → cart → checkout →
      /track/[id] never completes (tracker present, no "delivered"). Include the drawer→/checkout
      redirect step (outstanding task). Reduced-motion sanity check.
- [ ] `npm run test:e2e` green (env permitting; else CI).

## Slice 4 — verify + DoD review + PR
- [ ] Full gate green; `lib/sim` zero-diff; code-reviewer agent; PR → main (Closes #8 if exists).
