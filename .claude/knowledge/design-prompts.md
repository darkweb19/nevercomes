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
- **Design-gated phases:** 3 (browse + product), 4 (cart), 5 (checkout), 7 (tracker), 8 (landing),
  9 (/me + account upgrade), 10 (viral: share card + leaderboard + live counters),
  11-D (browse — cold region "preparing your store…" state). Phases 0, 1, 2, 6 need no screen.
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

## Phase 9 — /me (stats, order history, account upgrade)

```
Design the personal "/me" screen for NeverComes using my connected design system. Desktop web
first (~1440px), then tablet (~768px) and mobile (~390px). Deadpan tone, receipt aesthetic. This
is the retention screen: the user's whole relationship with a store that never delivers, told in
their own numbers. A quiet ledger, not a gamified dashboard.

SCREEN 1 — /me dashboard (desktop: stats strip on top, history as the main column):
- A stats strip in mono, styled like receipt totals. The hero number is MONEY SAVED — the ghost
  total of everything they never paid, big and struck-through-adjacent. Beside it: orders placed,
  orders delivered (always 0 — let the zero sit there, deadpan), and the streak in days ("days in
  a row of buying nothing").
- ORDER HISTORY as a stack of compact receipt rows: vendor, first item + "N more", ghost total
  struck through, date (mono), and a status chip that is always some flavor of "still in transit"
  or a small stamp-red "NEVER ARRIVED" for orders past the two-minute mark. Every row links back
  to its tracker. Use the perforation motif between rows.
- An empty state for a brand-new visitor: one dry line and a primary "Start a fake order" CTA.
- Optional quiet extras: a faded achievements row (small ink badges), nothing shiny.

SCREEN 2 — the account-upgrade moment (anonymous → permanent):
- Everything already works signed-out; this is an UPGRADE, never a gate. A calm inline card (or
  modal) on /me: "Claim your history" — email field + one OAuth button, pitched deadpan: the only
  thing at stake is your record of things that never arrived, and it would be a shame to lose it.
- Show three header states: anonymous (upgrade nudge visible), signed-in (email shown, sign-out),
  and the moment right after upgrading (a small stamped confirmation, not confetti).

Include loading and error states for the history list. Show both screens. Then I'll refine.
```

---

## Phase 10 — Viral (share card, leaderboard, live counters)

```
Design the "viral" surfaces for NeverComes using my connected design system. Desktop web first
(~1440px), then tablet (~768px) and mobile (~390px). Deadpan tone, receipt aesthetic. The joke
these surfaces sell: people competing over, and bragging about, purchases that never arrive.
Nothing here is triumphant — it's a quiet hall of records for a store with a 0% delivery rate.

SCREEN 1 — Leaderboard page (desktop: ranked table as the main column, global stats beside it):
- A ranked list styled like a long receipt: rank (mono), an auto-generated deadpan pseudonym
  (users are anonymous — think "Patient Stranger #4821", never real names), money saved (ghost
  total, struck-through-adjacent), orders placed, and longest wait. Perforation motif between rows.
- A tab or toggle for the ranking flavor: MOST SAVED / MOST ORDERS NEVER RECEIVED / LONGEST STREAK,
  plus a time filter (this week / all time).
- The current visitor's own row pinned or highlighted ("YOU"), with a dry nudge if they're not on
  the board yet ("Order nothing. Rise.").
- A side panel of global mono stats: total never-delivered orders, total money saved across
  everyone, "orders currently in transit" — and the anchor stat "0 delivered, ever".
- Include loading and empty states (a brand-new region with nobody on the board yet).

SCREEN 2 — OG share card (a STATIC 1200×630 social-preview image, not an interactive screen):
- This is the image that unfurls when someone pastes their link into a chat or feed. It must read
  at thumbnail size: one big deadpan claim in display type, mono numbers, the stamp-red accent,
  receipt-paper background, a dashed route line going nowhere, and a small rotated "NEVER ARRIVED"
  stamp. NeverComes wordmark small in a corner.
- Show 2–3 variants: (a) a single order ("In transit for 3 days. It never comes."), (b) personal
  stats from /me ("$412.88 saved. 0 things received."), (c) a leaderboard rank brag.
- Keep it flat and export-friendly — no gradients or effects that won't survive as a rendered PNG.

SCREEN 3 — live-counter moments (small components, not a page):
- A "people shopping right now" live counter and an "orders currently never arriving" ticker, in
  mono, calm — a slow heartbeat, not a slot machine. Show where they live: the landing social-proof
  strip (upgrading its static stats to live) and a compact variant for the site header or /browse.
- A SHARE moment: a small "Share your wait" control on the tracker and /me that produces the link
  behind the OG card — show its idle and copied/confirmed states (a small stamp, not confetti).
- Show a reduced-motion variant: counters update as stepped text changes, no pulsing.

Show all three. Then I'll refine.
```

---

## Phase 11-D — Browse: cold-region "preparing your store…" state

```
Design ONE new STATE for the existing NeverComes /browse screen (do not redesign browse — keep
its layout: category strip, filter/sort, search, multi-column receipt-item product grid). Use my
connected design system. Desktop web first (~1440px), then tablet (~768px) and mobile (~390px).
Deadpan tone, receipt aesthetic.

Context: the catalog is generated per postal region by an offline worker, usually within a few
minutes of a region's first-ever visitor. A visitor from a cold region still sees the GLOBAL
catalog (a small set of products that exist everywhere) — the store is never empty and never
blocked. What's "preparing" is their LOCAL layer: nearby fictional vendors and region-flavored
products that will slot in on top.

Design three states of the same screen:

STATE 1 — cold region (the main deliverable):
- The global products render normally and stay fully browsable/orderable.
- A calm banner or inline strip announces the local store is being prepared — phrased deadpan
  ("Preparing your store. The wait is the product." — feel free to improve the line).
- The progress metaphor is a RECEIPT PRINTING, not a spinner: a receipt stub emerging line by
  line from a perforated edge, or vendor lines appearing as faded ink that darkens. No spinners,
  no progress bars, no percent — this store is honest about nothing, including load time.
- Optionally: 2–3 ghost vendor-card placeholders (faded ink outlines) where local vendors will
  appear, so the promise is spatial, not just verbal.

STATE 2 — the moment it fills (cold → warm transition):
- The local vendors/products arrive into the grid — a quiet ink-settling or stamp moment, not
  confetti. The banner resolves to a small one-line confirmation ("Your store exists now.") that
  then goes away.

STATE 3 — warm region (the default, for contrast):
- Browse as it is today, local + global products mixed; no banner. Show it so the delta is clear.

Also show a reduced-motion variant of STATE 1: the receipt-printer animation degrades to a
static stub with stepped text (no line-by-line animation), and the fill-in transition becomes an
instant swap.

Show all three states (+ the reduced-motion variant) at desktop, and STATE 1 at tablet and
mobile. Then I'll refine.
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
