# NeverComes — Claude Design prompts (per phase, desktop-web first)

Companion to `design.md`, `spec.md`, and `execution-phases.md`. Paste these into **Claude Design**
(claude.ai/design) to produce each design-gated screen, just ahead of its build phase.

## How to use these

- **Connect your repo first** so Claude Design inherits your design system from `design.md`
  (colors, type, spacing). Use `/design-sync` or point onboarding at the repo. Then every prompt
  is on-brand without re-listing tokens.
- **Design desktop-web first (~1440px), then show tablet (~768px) and mobile (~390px).** Use the
  horizontal space (multi-column grids, side-by-side panels) — don't stretch a phone layout wide.
  Keep the mobile breakpoint in the set; the canonical user is on a phone late at night.
- **Design the NEXT screen while the current phase builds** (two-lane rhythm). Front-load the
  **tracker (Phase 7)** during the design-free phases (2, 6).
- **One screen per project/prompt.** Get a strong first draft, then refine on the canvas rather
  than long re-prompts (saves usage).
- **Handoff:** export the **Claude Code handoff bundle**, or paste the screen into the relevant
  `/new-feature <n>` session. Claude Code reimplements in Next.js + Tailwind against your tokens.
- **Design-gated phases:** 3 (browse + product), 4 (cart), 5 (checkout), 7 (tracker), 8 (landing).
  Phases 0, 1, 2, 6 need no screen.
- **Recommended order:** tracker → browse+product → cart → checkout → landing (landing last; its
  hero teases the tracker).

If the repo/design system isn't connected, prepend the "Brand context" block at the bottom.

---

## Phase 7 — Order tracking (THE hero — design this first)

```
Design the order-tracking screen for NeverComes — the emotional core of the product. The bit: the
courier is forever "in transit" and NEVER arrives. Use my connected design system. Design for
DESKTOP WEB first (~1440px), then show tablet (~768px) and mobile (~390px) adaptations.

NeverComes is a deadpan parody "dopamine site" — a simulated shopping/food-delivery app where you
do the full ritual (browse, cart, checkout, track) except nothing ever ships. Tone: dry, calm, a
little haunting — not frantic. Never mimic a real brand.

Desktop layout — use the horizontal space:
- A large MAP filling the main/left area, with the courier's route as a stamp-red DASHED line
  (reuse the perforation motif), a courier dot mid-route, and a destination pin.
- A right-hand panel: status timeline in mono (accepted → preparing → picked up → nearby) — final
  state NEVER becomes "delivered" — plus an ETA reading "~2 min away" that stalls/loops.
- The signature payoff: a slightly rotated rubber-stamp "NEVER ARRIVED" mark over the panel,
  shown after ~2 minutes.
- Calm, slightly haunting late-night mood. Deadpan.

Make it an interactive prototype if possible: animate the courier dot creeping along the dashed
route and the ETA never hitting zero, then the stamp. Show a reduced-motion / static variant. Try
2–3 directions for how "never arrives" is expressed.
```

---

## Phase 3 — Browse + Product detail

```
Design two screens for NeverComes, a deadpan parody "dopamine site": a simulated
shopping/food-delivery app where you do the whole ritual — browse, cart, checkout, track — except
nothing ever ships. Use my connected design system. Design DESKTOP WEB first (~1440px), then
tablet and mobile. Dry, self-aware, late-night. Do NOT mimic a real brand.

SCREEN 1 — Browse / catalog (use the width — multi-column grid):
- A scrollable multi-column catalog of vendors/products with imagery, name, price (mono), rating.
- A category strip and a filter/sort control (price, rating, "delivery time"); a search field.
- Product cards feel like receipt items — mono prices, perforated divider motif.
- Show the infinite-scroll loading state and a "preparing your store…" first-load state.

SCREEN 2 — Product detail (two-column on desktop: media left, info right):
- Product image(s), name, price, rating, a few fake reviews, options/modifiers.
- A prominent "Add to cart" (primary = stamp-red). Skimmable.

Show both screens. Then I'll refine.
```

---

## Phase 4 — Cart + cart drawer

```
Design the cart for NeverComes using my connected design system. Desktop web first, responsive.
Deadpan tone, receipt aesthetic.

1) A slide-in cart DRAWER (from the right) accessible anywhere: line items (image, name, qty
   stepper, line price in mono), remove control, a fake promo-code field, a running subtotal.
2) A full CART page styled like a paper receipt: itemized lines, fake fees (delivery, "service",
   taxes) as faded mono rows, perforated dashed dividers, a bold total, a primary "Checkout"
   (stamp-red). On desktop, consider receipt on the left, summary/CTA on the right.

Lean into the receipt metaphor hard here. Include an empty-cart state with a dry one-liner, and a
soft-cap message for absurd quantities ("Even imaginary warehouses have limits."). Show both.
```

---

## Phase 5 — Checkout (postal code + fake payment)

```
Design the checkout flow for NeverComes using my connected design system. Desktop web first,
responsive. Deadpan. Payment is fake and resolves to $0.00. IMPORTANT: we collect POSTAL CODE
ONLY — no street address.

Desktop: form on the left, an order summary (receipt style) on the right.
Steps to show:
1) Location step — a minimal form asking for POSTAL CODE only (no street address). A dry note that
   we don't want their real address.
2) A "payment" screen that LOOKS like a real checkout step but is clearly a bit, total resolving
   to $0.00. Primary "Place order" (stamp-red).
3) A processing moment (a stamp / receipt printing) that transitions to tracking.

Include form error/empty states. Keep the tone wry — the user knows nothing is charged. Show the steps.
```

---

## Phase 8 — Landing / hero (design last)

```
Design the landing page for NeverComes using my connected design system. Desktop web first,
responsive. Deadpan. Positioning: "All the dopamine of buying. None of the receipt."

Sections:
- HERO: tagline, one-line explainer, primary CTA "Start a fake order" (stamp-red) + secondary
  "How it (doesn't) work". Beside the copy, a teaser of the tracker (dashed route + courier dot +
  faint "NEVER ARRIVED" stamp) so the joke lands above the fold.
- "How it (doesn't) work": a horizontal 5-step flow using the perforation motif as connectors —
  Browse → Add to cart → Checkout → Track → It never arrives (land the punchline on the last).
- The (real) idea, briefly: dopamine fires in anticipation, not on receipt — styled like a quiet
  ink note, not a marketing wall.
- Deadpan social-proof strip: mono stats ("0 orders delivered", "$0.00 charged, ever", "1,204
  orders currently never arriving") + 2–3 dry testimonial cards.
- Closing CTA band + minimal wry footer (About, Privacy — "we keep your data fake/minimal").

Make the hero feel like the product, not a generic SaaS landing. Try 2 hero directions.
```

---

## Brand context block (prepend ONLY if the repo/design system isn't connected)

```
Brand: NeverComes. Aesthetic = "thermal receipt + delivery tracking." Warm receipt-paper surfaces
(~#E9E6DC), near-black ink (~#18181B), faded ink (~#7C766B), ONE bold accent = stamp-red
(~#A81F2D) used sparingly for stamps/CTAs/route lines. Perforated dashed-line motif doubles as
receipt tear-edge and delivery route. Type: Plus Jakarta Sans (display) + Space Mono
(data/prices/labels). Tone: dry, self-aware, a little haunting. Desktop-web primary, responsive to
mobile. Small radii (receipts are crisp). Never mimic real brands.
```
