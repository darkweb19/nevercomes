# PHASE 4 — Cart (drawer + receipt page)  [design-gated]

Build the cart to the imported Claude Design (`NeverComes cart design` → `Cart.dc.html`).
Two surfaces: a slide-in **CartDrawer** (dark, carbon) and a full **/cart receipt page**
(fixed light "paper" thermal receipt). Everything resolves to **$0.00 CAD**; real would-be
amounts show as struck-through **ghost prices**. Fake fees, fake promo, soft per-line cap.

**DoD (execution-phases + spec):** Zustand `lib/store/cart.ts` persisted to localStorage
(lines, quantities, fake fees, fake promo, running total); CartDrawer + cart page; cart never
hits the server until order; **cart math correct in integer cents**; persists across reload;
matches the design. `npm run verify` green per slice. Full-loop e2e stays Phase 8.

## Design → repo reconciliation (decisions)
- **Tokens:** the design references raw ramps (`--paper-*`, `--ink-*`, `--stamp-*`,
  `--thermal-fade`, `--border-perf`) that the repo collapsed into semantic vars. The receipt is
  fixed-light regardless of theme, so it needs the **raw ramps**. Add them to `app/tokens.css`
  with the canonical values from the design system's `colors.css` (already pulled). No new
  parallel system — just restore the raw ramp layer under the existing semantics.
- **Drawer = the existing `Sheet` primitive** (right side, focus-trap, Esc, overlay-click,
  reduced-motion already handled) — not the raw design markup. Build cart content inside it.
- **Stamp/perforation:** reuse the `<Stamp>` primitive + `.perforation` class; add a small
  tear-edge utility for the receipt's top/bottom torn edges (radial-gradient mask).
- **Money:** integer cents everywhere; `formatCents` for display. Fee math from the design:
  delivery = 499 if any items; service = round(subtotal·10%); tax = round((subtotal+delivery+
  service)·13%); ghostTotal = sum. **Real total = 0** (the gag). All ghost figures struck-through.
- **CartLine gets a price snapshot** (`priceCents`, `name`, `note`, `sku`) captured at add-time
  so the cart renders without re-fetching. `sku` derived (first 3 letters of name, uppercased).
- **Soft cap:** per-line quantity cap (const `LINE_SOFT_CAP = 24`, matches design; spec allows
  ≤99) → deadpan notice "Even imaginary warehouses have limits." Stepper `max` enforces it.
- **Promo:** any non-empty code → "applied", savings always $0.00 ("As designed"). No validation.
- **Checkout button (Phase 4):** `/checkout` doesn't exist until Phase 5, so the button plays the
  on-design "Processing $0.00… this may take forever" dots and does **not** navigate yet
  (TODO marker for Phase 5 to route to `/checkout`). Keeps the slice self-contained + on-gag.

## Slice 1 — Receipt token ramps  ✅
- [x] `app/tokens.css`: add raw `--ink-900..300`, `--paper-000..400`, `--stamp-700/600/500/400/100`,
      `--thermal-fade`, `--border-perf` (light + `.theme-dark` override) — exact canonical values.
      Refactored existing semantics to reference the raw ramps (byte-identical).
- [x] `tailwind.config.ts`: expose `paper`, `ink`, `stamp` color families + `thermal` so the
      receipt can use utility classes (carbon already mapped).
- [x] `app/globals.css`: add `.nc-tear-top` / `.nc-tear-bottom` torn-edge utilities (mask, `--nc-tear-bg`).
- [x] Add swatches + tear demo to `/scratch`; `npm run verify` green (15 tests).

## Slice 2 — Cart store buildout + pure totals (test-alongside)  ✅
- [x] `lib/cart/totals.ts` (pure, integer cents): `subtotalCents`, `deliveryCents`, `serviceCents`,
      `taxCents`, `ghostTotalCents`, `count` from lines. `realTotalCents` ≡ 0.
- [x] `tests/unit/cart-totals.test.ts`: math + rounding in cents; empty cart = all 0; realTotal 0.
- [x] `lib/store/cart.ts`: extended `CartLine` (snapshot fields + stable `lineId`); `persist`
      middleware (localStorage key `nc-cart`, versioned, SSR-safe memory fallback); actions `setQty`
      (clamp to soft cap → sets `capHit`), `removeLine`, `clear`, merge-on-add (same productId+
      options, order-independent), `applyPromo`/`setPromo`/`promo`/`promoApplied`, drawer `open`/
      `openDrawer`/`closeDrawer`. Kept `count()`.
- [x] `tests/unit/cart-store.test.ts`: add→merge, distinct options, setQty cap + capHit clear,
      setQty 0 removes, removeLine, clear, promo, count() (reset via `setState` in `beforeEach`).
- [x] `components/catalog/AddToCart.tsx`: passes name/priceCents/note snapshot into `addLine`;
      caller in `app/product/[id]/page.tsx` updated.
- [x] `npm run verify` green (33 tests).

## Slice 3 — CartDrawer (on `Sheet`) + header wiring  ✅
- [x] `components/cart/CartDrawer.tsx`: `<Sheet>` with header (count pill), scrollable line list
      (compact: sku chip, name, note, $0.00 + ghost strike, `<Stepper>`, remove), soft-cap notice,
      footer (promo Input + Apply, subtotal $0.00 + ghost, "fees & taxes at the receipt",
      Checkout · $0.00 → forever-spinner dots, "View full receipt" → `/cart`). Empty state.
- [x] Mount `<CartDrawer>` directly in `app/layout.tsx` (client component into server layout) so
      any page's header opens it. Build confirms pages stay static.
- [x] `components/catalog/SiteHeader.tsx`: cart button → `openDrawer()`.
- [x] Reduced-motion (Sheet slide + `ncDots` degrade via global reset) + keyboard/focus/Esc from Sheet.
- [x] `npm run verify` green (33 tests) + `npm run build` clean.
      ⚠️ Interactive click-through not browser-tested (env blocks automation); verified via verify+build+code.

## Slice 4 — /cart receipt page
- [ ] `app/cart/page.tsx` (client; cart is client-only). SiteHeader + page header (eyebrow/title/
      blurb). **Receipt** (paper, tear edges): store header + order id + item count; line items
      (image/sku tile, name, note, $0.00 + ghost line strike, `<Stepper>`, Remove); soft-cap notice;
      fee rows (Subtotal / Delivery / Service / Tax — each $0.00 with ghost strike); Total $0.00 CAD
      + "WOULD'VE BEEN {ghost}"; "NO REFUND. NOTHING WAS CHARGED." **Sticky summary aside**
      (`<Card raised>`): order summary, promo Input + Apply ("Savings: $0.00. As designed."),
      Total $0.00, `<Button primary lg block>` Checkout · $0.00 → plays processing dots.
- [ ] **Empty state**: perforated paper card, `<Stamp label="NEVER ADDED">`, "Browse anyway" → `/browse`.
- [ ] Dots + any motion degrade under `prefers-reduced-motion`; keyboard pass.
- [ ] `npm run verify` green + `npm run build` clean.

## Slice 5 — Polish + review + PR
- [ ] Final a11y/motion pass; fresh-context diff review (code-reviewer agent) vs. DoD.
- [ ] Confirm DoD: integer-cents math ✓; persists across reload ✓; drawer + page match design ✓.
- [ ] Commit per slice; open PR `phase-4-cart` → `main` (Closes #4 if that issue exists).

## Known env limitation (carry-over from Phase 3)
- Interactive browser automation is blocked by the env's chrome-blocker hook and no web-tester
  agent is available here. Verify via `verify` + `build` + server-rendered assertions; flag a
  **manual eyeball** at `/cart` + drawer (stepper, remove, promo, reload-persistence, theme) as
  the human step before merge. Will not claim visual verification I can't run.
