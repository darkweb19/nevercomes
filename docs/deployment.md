# NeverComes — Deployment Runbook

## 1. Overview

| What | Where | Trigger |
|------|-------|---------|
| Next.js frontend | Vercel | Auto on merge to `main` |
| Supabase schema + catalog data | Supabase prod | Auto via `db.yml` on merge to `main` |
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

> **Never add** `SUPABASE_SERVICE_ROLE_KEY` to Vercel — the app never uses it.
> That key belongs to GitHub Actions secrets only.

### GitHub repo secrets (already set)
`db.yml` needs: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`

`keep-alive.yml` needs: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

All are already set under Settings → Secrets and variables → Actions.

> **Note:** `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` were used by the now-removed
> catalog worker (`catalog.yml`). Neither is needed anymore. The static catalog ships as a
> data migration (`supabase/migrations/`) so prod and local always have the same dataset.

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

## 4. Catalog data

The static catalog (4 vendors, 30 products, 7 reviews, 2 dev regions) ships as a committed
data migration (`supabase/migrations/`). There is no separate catalog worker, no cron job,
and no Anthropic API key required.

`db.yml` applies all pending migrations on merge to `main`, so prod and local always have
the same catalog dataset. No manual preseed step is needed.

---

## 5. Post-deploy verification checklist

Run these after any deploy that touches the core loop or catalog:

- [ ] Open `/browse` — catalog renders with products and vendor cards
- [ ] Place an anonymous order end-to-end — lands on `/track`, courier never arrives
- [ ] Check `/leaderboard` — renders without errors
- [ ] Open `/api/og?...` with a valid order slug — share card image returns 200
- [ ] Confirm catalog populated (Supabase SQL editor, read-only):

```sql
select count(*) from products;   -- expect 30
select count(*) from vendors;    -- expect 4
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
