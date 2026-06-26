# Knowledge: Design system & Claude Design handoff

## Two layers, two timelines

- **Design system** (this file): colors, type, spacing, primitives. **Ready now.** Source of
  truth for *look* from Phase 1 onward.
- **Product design** (screen layouts): produced **later, screen-by-screen, in Claude Design**,
  just ahead of each feature phase. Build the real Next.js implementation **toward** the
  provided screen using these tokens.

## Workflow rules (important)

1. A UI feature phase is **gated on its Claude Design screen existing.** If the design for a
   screen hasn't been provided, **stop and ask — do not invent the layout.**
2. The Claude Design output is the **visual spec, not shippable code.** Reimplement it in
   Next.js + Tailwind using the tokens below.
3. When a new screen design arrives, I'll paste it (or a link/spec). Translate it faithfully:
   match spacing, hierarchy, and the tokens — don't substitute your own aesthetic.
4. If a design conflicts with these tokens, flag it rather than silently diverging.

---

## Design tokens

> ⚠️ REPLACE the values below with the finalized values from the ready design system if they
> differ. These reflect the agreed creative direction; treat them as authoritative only after
> I confirm they match the Claude Design system output.

**Creative direction:** "thermal receipt + delivery tracking." Warm receipt-paper surfaces,
near-black ink, a single stamp-red accent used sparingly, a perforated dashed-line motif that
doubles as receipt tear-edge AND delivery route. Signature element: a rubber-stamp
"NEVER ARRIVED" mark. Tone: dry, self-aware, a little haunting. DESKTOP WEB primary (~1440px), responsive down to tablet (~768px) and mobile (~390px). Late-night feel.

**Layout:** design desktop-first and use the horizontal space — multi-column catalog grids,
side-by-side map + status panel on the tracker, checkout form beside an order summary. Don't just
stretch a phone layout wide. Always include the mobile breakpoint in the responsive set, since the
canonical user is on a phone late at night.

### Color (fill from the design system)
```
--paper        #E9E6DC   /* primary surface (receipt paper) */
--paper-2      #F3F1EA   /* raised surface */
--ink          #18181B   /* primary text */
--ink-faded    #7C766B   /* secondary text / faded thermal print */
--stamp        #A81F2D   /* the one bold accent — stamps, key CTAs, the route line */
--rule         rgba(24,24,27,0.15)   /* dashed perforation / route lines */
--ok           #2F7D55
--warn         #E0A82E
```
Spend bold color in ONE place (the stamp / route). Everything else is quiet ink on paper.

### Type
```
display  : "Bricolage Grotesque", sans-serif   /* headlines, the stamp */
mono     : "Space Mono", monospace             /* data, labels, prices, tracking codes, receipts */
scale    : 12 / 14 / 16 / 20 / 28 / 40 / 56    /* px, desktop-web primary, responsive */
```
Use mono for anything receipt/tracking-flavored (prices, order IDs, ETAs, status lines).

### Spacing & radius
```
space : 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64    (Tailwind 1,2,3,4,6,8,12,16)
radius: sm 4px · md 8px · lg 12px  (receipts are crisp — keep radii small)
```

### Motifs
- **Perforation/route:** dashed 1px line in `--rule`; reuse for receipt edges, dividers, and the
  courier route on the map.
- **Stamp:** slightly rotated, ~`--stamp`, low-ink texture; the "NEVER ARRIVED" payoff.

### Core primitives (`components/ui/`)
`Button` (primary=stamp, ghost), `Input`, `Card` (paper-2 + perforation top edge), `Badge`,
`Sheet`/drawer, `Stamp`. Keep them presentational; side effects live in hooks.

### Tracker screen (the hero — design it most carefully in Claude Design)
Map (MapLibre) · dashed route in `--stamp` · courier dot · mono status timeline
(accepted → preparing → picked_up → nearby) · an ETA that counts down then **never resolves** ·
the "NEVER ARRIVED" stamp. Respect `prefers-reduced-motion` (degrade to stepped/static).
