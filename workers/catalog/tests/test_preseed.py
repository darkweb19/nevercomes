"""
Tests for the pre-seed launch-region table (pure — no network, no env vars).
"""

from __future__ import annotations

from catalog.preseed import GTA_REGIONS, region_row


class TestGtaRegions:
    def test_prefixes_unique(self):
        prefixes = [r["postal_prefix"] for r in GTA_REGIONS]
        assert len(prefixes) == len(set(prefixes))

    def test_prefixes_are_fsa_shaped(self):
        for r in GTA_REGIONS:
            p = r["postal_prefix"]
            assert len(p) == 3 and p[0].isalpha() and p[1].isdigit() and p[2].isalpha()

    def test_coords_inside_gta_bounds(self):
        for r in GTA_REGIONS:
            lat, lng = r["centroid"]
            assert 43.4 < lat < 44.1, r["postal_prefix"]
            assert -80.0 < lng < -79.0, r["postal_prefix"]

    def test_seeded_launch_region_included(self):
        # M5V is seeded (catalog_generated=true) — preseed must include it and
        # rely on the idempotency guard to skip it, not overwrite it.
        assert any(r["postal_prefix"] == "M5V" for r in GTA_REGIONS)


class TestRegionRow:
    def test_row_shape(self):
        row = region_row(GTA_REGIONS[0])
        assert row["postal_prefix"] == GTA_REGIONS[0]["postal_prefix"]
        assert row["catalog_generated"] is False
        assert row["places_fetched"] is False
        assert isinstance(row["centroid_lat"], float)
        assert isinstance(row["city_centroid_lng"], float)
