# NeverComes — Deployment Runbook

## 1. Overview

| What | Where | Trigger |
|------|-------|---------|
| Next.js frontend | Vercel | Auto on merge to `main` |
| Supabase schema | Supabase prod | Auto via `db.yml` on merge to `main` |
| Catalog worker | GitHub Actions | Cron every 15 min + manual dispatch |
| Keep-alive ping | GitHub Actions | Cron Mon/Thu 06:00 UTC |

No servers to manage. No containers. No manual deploys under normal operation.

---

## 2. One-time setup checklist

### Vercel (already done)
- [x] Vercel project linked to the GitHub repo — pushes to `main` auto-deploy
- [x] Environment variables set in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`

> **Never add** `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` to Vercel — the app
> never uses them. Those keys belong to GitHub Actions secrets only.

### GitHub repo secrets (already set)
`db.yml` needs: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`

`catalog.yml` + `keep-alive.yml` need: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`

All six are already set under Settings → Secrets and variables → Actions.

### Supabase dashboard — ACTION REQUIRED (out-of-band toggles, not migrations)

These cannot be expressed as SQL migrations and must be set manually in the prod Supabase
dashboard **before the site handles real traffic**:

- [ ] **Enable Anonymous Sign-Ins** — Authentication → Settings → Enable anonymous sign-ins.
      Without this the checkout loop returns 401 on every anonymous order.
- [ ] **Configure custom SMTP** — Authentication → Settings → SMTP provider.
      The built-in sender is rate-limited to ~2 emails/hr. Set a real SMTP provider (e.g.
      Resend, SendGrid) so claim-your-history upgrade emails are delivered reliably.

---

## 3. Routine deploy flow

```
git push / merge PR to main
  └─ CI (ci.yml)     → typecheck + lint + unit + Playwright e2e — must be green
  └─ db.yml          → verify types in sync, then push new migrations to prod Supabase
  └─ Vercel          → builds and deploys the Next.js frontend
```

Nothing manual. If `types/database.ts` is stale, `db.yml` fails the PR before it can merge.

Check migration drift at any time:

```bash
npm run db:status    # shows which migrations are applied locally vs remotely
```

---

## 4. Catalog worker (Phase 11)

After the phase-11 PR merges to `main`:

### Initial preseed (once, at launch)

Dispatch the "Catalog worker" workflow manually from the Actions tab (or via CLI):

```bash
gh workflow run catalog.yml -f preseed=true
```

This calls `catalog.preseed`, which upserts the GTA launch regions (~10 FSAs) and generates
each one. Each region costs well under $0.50 on Claude Haiku 4.5.

### Ongoing (automatic)

The 15-min cron runs `--all-pending --max-regions 5`. Any region where
`regions.catalog_generated = false` (created by a first visitor to a cold postal prefix)
is picked up and filled automatically — no action needed.

### Single-region regeneration (manual)

```bash
gh workflow run catalog.yml -f postal_prefix=M5V -f force=true
```

Wipes and regenerates that FSA only.

### Monitoring

```bash
gh run list --workflow=catalog.yml     # recent runs + status
gh run view <run-id> --log             # full logs for a run
```

Audit trail: every run writes an `events` row with `type = catalog_generated`, including
counts, model, temperature, and token usage. Query in the Supabase SQL editor (read-only):

```sql
select * from events where type = 'catalog_generated' order by created_at desc limit 20;
```

---

## 5. Post-deploy verification checklist

Run these after any deploy that touches the core loop or catalog:

- [ ] Open `/browse` — catalog renders with products and vendor cards
- [ ] Place an anonymous order end-to-end — lands on `/track`, courier never arrives
- [ ] Check `/leaderboard` — renders without errors
- [ ] Open `/api/og?...` with a valid order slug — share card image returns 200
- [ ] After preseed: confirm catalog populated (Supabase SQL editor, read-only):

```sql
select count(*) from products where region_id is not null;
```

---

## 6. Rollback

| Situation | Action |
|-----------|--------|
| Bad frontend deploy | Vercel dashboard → Deployments → Promote previous deployment |
| Bad feature commit | `git revert <slice-commit-sha>` — one slice = one commit by convention |
| Bad schema migration | Write a follow-up migration to undo it. **Never hand-edit prod.** See `rules/supabase_migrations.md`. |

> Schema rollback is always a forward migration, never a Studio edit. The migration log is
> the source of truth.
