"""
CLI entrypoint for the NeverComes catalog worker.

Usage (from workers/catalog/):
  python -m catalog.run --postal-prefix M5V
  python -m catalog.run --all-pending [--max-regions N]
  python -m catalog.run --postal-prefix M5V --force

The pure decision logic (plan_regions / should_generate) is kept here
so tests can import and verify it without any DB or LLM interaction.
"""

from __future__ import annotations

import argparse
import logging
import sys
from typing import Any

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pure decision logic (testable without DB/LLM)
# ---------------------------------------------------------------------------


def should_generate(region: dict[str, Any], force: bool) -> bool:
    """
    Return True if this region should have its catalog generated.
    - Skips regions where catalog_generated=true unless force=True.
    """
    if region.get("catalog_generated") and not force:
        log.info(
            "Skipping %s: catalog_generated=true (use --force to regenerate)",
            region.get("postal_prefix", "?"),
        )
        return False
    return True


def plan_regions(
    regions: list[dict[str, Any]],
    force: bool,
    max_regions: int | None = None,
) -> list[dict[str, Any]]:
    """
    Filter and cap the list of regions to process.

    - If force is False: skip regions with catalog_generated=true.
    - If force is True: include all regions (but force only applies to the
      --postal-prefix flow; in --all-pending flow we only pass pending regions).
    - Caps the result at max_regions if provided.
    - Preserves the input order (caller should pass regions ordered by created_at).
    """
    selected = [r for r in regions if should_generate(r, force)]
    if max_regions is not None:
        selected = selected[:max_regions]
    return selected


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def _print_summary(
    processed: list[str],
    skipped: list[str],
    failed: list[tuple[str, str]],
    total_usage: dict[str, int],
) -> None:
    print("\n--- Catalog Worker Summary ---")
    print(f"  Processed: {len(processed)}  Skipped: {len(skipped)}  Failed: {len(failed)}")
    if processed:
        print(f"  Regions generated: {', '.join(processed)}")
    if skipped:
        print(f"  Regions skipped:   {', '.join(skipped)}")
    if failed:
        for prefix, err in failed:
            print(f"  FAILED {prefix}: {err}")
    print(
        f"  Token usage: {total_usage.get('input_tokens', 0):,} in / {total_usage.get('output_tokens', 0):,} out"
    )
    print("------------------------------\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="NeverComes offline catalog generator",
        prog="python -m catalog.run",
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--postal-prefix",
        metavar="PREFIX",
        help="Generate catalog for a single region (e.g. M5V)",
    )
    group.add_argument(
        "--all-pending",
        action="store_true",
        help="Generate catalogs for all regions with catalog_generated=false",
    )

    parser.add_argument(
        "--max-regions",
        type=int,
        metavar="N",
        help="(with --all-pending) cap the number of regions to process",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="(with --postal-prefix) delete existing catalog and regenerate even if catalog_generated=true",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable debug logging",
    )

    args = parser.parse_args(argv)

    if args.max_regions is not None and not args.all_pending:
        parser.error("--max-regions requires --all-pending")

    if args.force and not args.postal_prefix:
        parser.error("--force requires --postal-prefix")

    _setup_logging(args.verbose)

    # Import here so the module can be imported in tests without env vars
    from .db import get_pending_regions, get_region_by_prefix
    from .graph import run_for_region

    processed: list[str] = []
    skipped: list[str] = []
    failed: list[tuple[str, str]] = []
    total_usage: dict[str, int] = {"input_tokens": 0, "output_tokens": 0}

    if args.postal_prefix:
        prefix = args.postal_prefix.upper()
        region = get_region_by_prefix(prefix)
        if region is None:
            log.error("Region not found: %s", prefix)
            return 1

        if not should_generate(region, force=args.force):
            skipped.append(prefix)
            _print_summary(processed, skipped, failed, total_usage)
            return 0

        log.info("Starting catalog generation for %s", prefix)
        try:
            final_state = run_for_region(region, force=args.force)
            usage = final_state.get("usage", {})
            total_usage["input_tokens"] += usage.get("input_tokens", 0)
            total_usage["output_tokens"] += usage.get("output_tokens", 0)
            processed.append(prefix)
        except Exception as exc:
            log.error("Failed to generate catalog for %s: %s", prefix, exc)
            failed.append((prefix, str(exc)))

    elif args.all_pending:
        pending = get_pending_regions(max_regions=args.max_regions)
        if not pending:
            log.info("No pending regions found.")
            _print_summary(processed, skipped, failed, total_usage)
            return 0

        log.info("Found %d pending region(s)", len(pending))
        # get_pending_regions already applied the max_regions cap; plan_regions
        # here is only the defensive catalog_generated filter.
        regions_to_run = plan_regions(pending, force=False)

        for region in regions_to_run:
            prefix = region["postal_prefix"]
            log.info("Processing region %s", prefix)
            try:
                final_state = run_for_region(region, force=False)
                usage = final_state.get("usage", {})
                total_usage["input_tokens"] += usage.get("input_tokens", 0)
                total_usage["output_tokens"] += usage.get("output_tokens", 0)
                processed.append(prefix)
            except Exception as exc:
                log.error("Failed to generate catalog for %s: %s", prefix, exc)
                failed.append((prefix, str(exc)))

    _print_summary(processed, skipped, failed, total_usage)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
