# PHASE 0 — Scaffold

Stand up the project skeleton. **Build NO features.** DoD: structure matches
`docs/nevercomes-codebase-and-requirements.md §1`, `pnpm dev` boots, `pnpm verify` runs green.

Decisions (confirmed): **Next.js 16** (true latest stable — create-next-app installed 16.2.9 +
React 19.2; chosen over the plan's original "15") · **Tailwind v3** (config-based) · package
manager **pnpm**. create-next-app ships Tailwind v4 by default, so we pin Tailwind back to v3
manually so Phase 1 can wire tokens into `tailwind.config.ts`. Note: Next 16 removed `next lint`,
so the `lint` script is `eslint` (flat config).

PRESERVE, never overwrite: `.claude/`, `.github/`, `docs/`, `README.md`, `SETUP.md`,
`.gitignore`, `.env.example`, and `package.json` (merge into it — keep all existing scripts).

---

## 1. Pre-flight
- [x] Tooling present: node 25, pnpm 9.10, supabase 2.72, npx 11.
- [ ] Confirm working dir is clean of generated artifacts (no `node_modules`, no lockfile yet).
- [ ] Snapshot the 8 preserved files mentally; nothing in this phase rewrites their intent.

## 2. Scaffold Next.js 15 (App Router + TS + ESLint) into a temp dir, then reconcile
Scaffold into a throwaway dir so `create-next-app` never fights the existing files:
- [ ] `pnpm create next-app@latest .next-scaffold --ts --eslint --app --src-dir=false \`
      `--import-alias "@/*" --use-pnpm --no-git --no-turbopack` (NO `--tailwind`; we add v3 by hand).
- [ ] Copy generated config/app files into repo root (do NOT copy its package.json / lockfile):
      `next.config.mjs`, `tsconfig.json`, `next-env.d.ts`, `.eslintrc.json` (or `eslint.config.mjs`),
      `app/` (layout.tsx, page.tsx, globals.css), `public/` assets.
- [ ] Delete `.next-scaffold/` entirely.

## 3. Merge package.json (keep MY scripts, switch npm→pnpm, add deps)
- [ ] Keep the existing `scripts` block verbatim, except rewrite internal `npm run` → `pnpm`:
      `verify` → `pnpm typecheck && pnpm lint && pnpm test`; `db:sync` → `supabase db reset && pnpm db:types`.
- [ ] Merge in Next's `dependencies` (`next`, `react`, `react-dom`) and `devDependencies`
      (`typescript`, `@types/*`, `eslint`, `eslint-config-next`) — but our `dev/build/start/lint`
      script lines win (they already match).
- [ ] Keep the `comments` block.

## 4. Tailwind v3 (config-based) setup by hand
- [ ] `pnpm add -D tailwindcss@^3 postcss autoprefixer`
- [ ] `pnpm exec tailwindcss init -p` → creates `tailwind.config.ts` + `postcss.config.js` (v3).
- [ ] Set `content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}']`; leave `theme.extend`
      empty (Phase 1 wires design tokens here — do not invent tokens now).
- [ ] `app/globals.css` = the three v3 directives (`@tailwind base/components/utilities`) only.

## 5. Canonical folder structure (per codebase doc §1) — dirs + placeholders, NO logic
Create empty dirs with `.gitkeep`, and placeholder files only where a real file is expected later.
**No feature code** (no real Supabase clients, no sim, no store — those are later phases).
- [ ] `app/` already from scaffold. Add route-segment dirs as empty `.gitkeep` placeholders:
      `app/browse/`, `app/product/[id]/`, `app/cart/`, `app/checkout/`, `app/track/[orderId]/`,
      `app/me/`, `app/api/orders/`, `app/api/og/`, `app/(marketing)/`.
      (No `page.tsx`/`route.ts` yet — those arrive with their phases.)
- [ ] `components/{catalog,cart,checkout,tracker,ui}/.gitkeep`
- [ ] `lib/{supabase,store,sim,analytics,utils}/.gitkeep`
- [ ] `types/.gitkeep` (generated `database.ts` lands in Phase 2)
- [ ] `tests/unit/.gitkeep`, `tests/e2e/.gitkeep`
- [ ] `public/` from scaffold (keep or trim default svgs)

## 6. Supabase — local config only (NO link, NO remote)
- [ ] `supabase init` → creates `supabase/config.toml` (+ `.gitignore` entries; reconcile with ours).
      Do NOT `supabase link`, do NOT touch any remote project. Docker stack stays off until Phase 2.
- [ ] Ensure `supabase/migrations/` exists (empty, `.gitkeep`) and `supabase/seed.sql` placeholder
      (empty/commented) so the structure matches the doc. No schema this phase.

## 7. Vitest (unit) — trivial passing test wired to `verify`
- [ ] `pnpm add -D vitest @vitest/coverage-v8`
- [ ] `vitest.config.ts`: `test.include = ['tests/unit/**/*.test.ts', 'lib/**/*.test.ts']`,
      `environment: 'node'`, resolve `@/*` alias. Exclude `tests/e2e/**`.
- [ ] `tests/unit/smoke.test.ts`: one trivial `expect(1 + 1).toBe(2)` test.

## 8. Playwright (e2e) — trivial passing test wired to `test:e2e`
- [ ] `pnpm add -D @playwright/test` then `pnpm exec playwright install --with-deps chromium`.
- [ ] `playwright.config.ts`: `testDir: 'tests/e2e'`, no `webServer` yet (added when the loop exists).
- [ ] `tests/e2e/smoke.spec.ts`: one trivial assertion that needs no server.
- [ ] Confirm Vitest and Playwright don't collide (separate dirs + globs).

## 9. CI / workflows → pnpm
- [ ] `.github/workflows/db.yml`: update the stale-types error message `npm run db:types` → `pnpm db:types`.
      (This job uses the supabase CLI directly, so it needs no pnpm step — leave its logic intact.)
- [ ] Add `.github/workflows/ci.yml` (the `verify` gate `rules/testing.md` says CI must run on every
      PR — currently nothing does): checkout → `pnpm/action-setup@v4` → `actions/setup-node@v4`
      (node 20, `cache: pnpm`) → `pnpm install --frozen-lockfile` → `pnpm verify`.
- [ ] `keep-alive.yml`: no change (curl only, no pnpm).

## 10. Lockfile + env + tsconfig hygiene
- [ ] Ensure `pnpm-lock.yaml` is generated and committed; delete any `package-lock.json`/`yarn.lock`.
- [ ] `.env.example`: already matches what code will expect (Supabase URL/anon, service role,
      PostHog). No change needed — confirm only.
- [ ] `tsconfig.json`: confirm `@/*` path alias and that test/config `.ts` files typecheck clean.
- [ ] `.gitignore`: confirm covers `.next/`, `node_modules/`, supabase local, playwright artifacts
      (it already does). Add `*.tsbuildinfo` if missing.

## 11. Verify (the DoD gate)
- [ ] `pnpm install` clean.
- [ ] `pnpm verify` → typecheck + lint + unit all green.
- [ ] `pnpm test:e2e` → trivial Playwright test green.
- [ ] `pnpm dev` boots (curl `http://localhost:3000` returns 200), then stop it.
- [ ] `pnpm build` succeeds (catches config/type issues the dev server hides).

## Definition of Done
- [ ] Folder tree matches `docs/nevercomes-codebase-and-requirements.md §1`.
- [ ] `pnpm dev` boots; `pnpm verify` green; `pnpm test:e2e` green.
- [ ] No features built (no Supabase clients, sim, store, or UI logic).
- [ ] All 8 preserved files intact; `package.json` scripts preserved + pnpm-ized.
- [ ] `pnpm-lock.yaml` committed; no `package-lock.json`.
- [ ] No `service_role` key anywhere; `.env.example` has no secrets.
