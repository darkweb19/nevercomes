# NeverComes catalog worker

Offline Python + LangGraph worker that generates the per-region fictional catalog
(vendors, products, reviews) with Claude Haiku 4.5 and writes it to Supabase Postgres.
Per spec §6 it runs **once per region, offline** — the web request path never calls an LLM.

- Idempotent: a region with `regions.catalog_generated = true` is skipped (use `--force`
  to delete that region's generated rows and regenerate).
- Writes with the `service_role` key only (catalog tables are public-read via RLS with no
  write policies). Never expose these env vars to the Next.js app.
- Every run writes an `events` audit row (`type: catalog_generated`) with counts, model,
  temperature, and token usage.
- Content guardrails: pydantic validation (integer-cents price bounds, options shape) plus
  a word-boundary real-brand blocklist over every generated string; one retry, then abort.

## Setup

```bash
cd workers/catalog
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env    # fill in values
```

For local dev, run the app's local stack from the repo root (`npm run db:start`), then take
`SUPABASE_URL` (API URL) and `SUPABASE_SERVICE_ROLE_KEY` from `npx supabase status`.
`ANTHROPIC_API_KEY` is your own key; a full region costs well under $0.50 on Haiku 4.5.

## Run

```bash
.venv/bin/python -m catalog.run --postal-prefix M5V           # one region
.venv/bin/python -m catalog.run --postal-prefix M5V --force   # wipe + regenerate that region
.venv/bin/python -m catalog.run --all-pending --max-regions 5 # what the scheduled job runs
.venv/bin/python -m catalog.preseed                           # ensure + fill the GTA launch regions
```

## Tests

```bash
.venv/bin/python -m pytest tests/ -q
```

Pure logic only — no network, no env vars needed.

## CI / production

`.github/workflows/catalog.yml` runs `--all-pending --max-regions 5` every 15 minutes and
exposes a manual `workflow_dispatch` (single FSA, `--force`, or pre-seed). Repo secrets:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.
