---
description: Pre-deploy checklist — verify, confirm migrations + types are in sync, then deploy.
argument-hint: "[optional: 'preview' or 'prod']"
---

Target: **${ARGUMENTS:-preview}**

Run a safe deploy. Stop at the first failure and report it — never force past a red check.

1. **Verify:** `npm run verify` and `npm run test:e2e`. Both must be green.
2. **DB sync check:**
   - `npm run db:status` — confirm local and remote migrations match (no drift).
   - `npm run db:types:check` — confirm `types/database.ts` is not stale. If it is, run
     `npm run db:types`, commit, and stop so I can review.
3. **Migrations:** if there are unpushed migrations, remind me they deploy via CI
   (`.github/workflows/db.yml`) on merge to `main` — do NOT run `db:push` from here unless I
   explicitly confirm a manual push.
4. **Secrets sanity:** confirm no `service_role` key is referenced in client code and nothing
   secret is committed.
5. **Deploy the app:** for `prod`, this is a merge to `main` (Vercel + the DB workflow run on
   merge); for `preview`, a Vercel preview from the current branch.

Report: check results, anything blocking, and the exact next command for me to run.
