"""
Pre-seed the GTA launch regions (spec §6: pre-seed launch regions so the
first-visitor "preparing your store…" penalty is rare in practice).

Usage (from workers/catalog/):
  python -m catalog.preseed

For each launch FSA: insert the regions row if it doesn't exist (never
overwrites an existing row or its flags), then generate the catalog for
every region still pending. Existing filled regions (e.g. the seeded M5V)
are skipped by the normal idempotency guard.
"""

from __future__ import annotations

import logging
import sys
from typing import Any

log = logging.getLogger(__name__)

# Static FSA → centroid table for the Toronto/GTA launch set.
# centroid = rough FSA centre; city_centroid = the city core the tracker frames.
_TORONTO_CORE = (43.6532, -79.3832)
_MISSISSAUGA_CORE = (43.5896, -79.6444)
_RICHMOND_HILL_CORE = (43.8828, -79.4403)

GTA_REGIONS: list[dict[str, Any]] = [
    {"postal_prefix": "M5V", "centroid": (43.6426, -79.3871), "city": _TORONTO_CORE},
    {"postal_prefix": "M5G", "centroid": (43.6579, -79.3873), "city": _TORONTO_CORE},
    {"postal_prefix": "M4Y", "centroid": (43.6656, -79.3830), "city": _TORONTO_CORE},
    {"postal_prefix": "M6J", "centroid": (43.6471, -79.4197), "city": _TORONTO_CORE},
    {"postal_prefix": "M5A", "centroid": (43.6547, -79.3623), "city": _TORONTO_CORE},
    {"postal_prefix": "M4C", "centroid": (43.6895, -79.3155), "city": _TORONTO_CORE},
    {"postal_prefix": "M2N", "centroid": (43.7685, -79.4130), "city": _TORONTO_CORE},
    {"postal_prefix": "M9V", "centroid": (43.7394, -79.5884), "city": _TORONTO_CORE},
    {"postal_prefix": "L5B", "centroid": (43.5890, -79.6441), "city": _MISSISSAUGA_CORE},
    {"postal_prefix": "L4C", "centroid": (43.8710, -79.4373), "city": _RICHMOND_HILL_CORE},
]


def region_row(entry: dict[str, Any]) -> dict[str, Any]:
    """Build a regions insert payload from a GTA_REGIONS entry (pure, testable)."""
    lat, lng = entry["centroid"]
    city_lat, city_lng = entry["city"]
    return {
        "postal_prefix": entry["postal_prefix"],
        "centroid_lat": lat,
        "centroid_lng": lng,
        "city_centroid_lat": city_lat,
        "city_centroid_lng": city_lng,
        "catalog_generated": False,
        "places_fetched": False,
    }


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    # Imported here so the module stays importable without env vars
    from .db import get_region_by_prefix, insert_region
    from .graph import run_for_region
    from .run import should_generate

    ensured: list[dict[str, Any]] = []

    for entry in GTA_REGIONS:
        prefix = entry["postal_prefix"]
        existing = get_region_by_prefix(prefix)
        if existing:
            log.info("Region %s exists (catalog_generated=%s)", prefix, existing["catalog_generated"])
            ensured.append(existing)
            continue
        created = insert_region(region_row(entry))
        log.info("Created region %s", prefix)
        ensured.append(created)

    processed: list[str] = []
    skipped: list[str] = []
    failed: list[tuple[str, str]] = []

    for region in ensured:
        prefix = region["postal_prefix"]
        if not should_generate(region, force=False):
            skipped.append(prefix)
            continue
        try:
            run_for_region(region, force=False)
            processed.append(prefix)
        except Exception as exc:
            log.error("Failed to generate catalog for %s: %s", prefix, exc)
            failed.append((prefix, str(exc)))

    log.info(
        "Pre-seed complete: %d generated (%s), %d skipped (%s), %d failed",
        len(processed), ", ".join(processed) or "-",
        len(skipped), ", ".join(skipped) or "-",
        len(failed),
    )
    for prefix, err in failed:
        log.error("FAILED %s: %s", prefix, err)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
