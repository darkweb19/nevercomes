"""
Tests for the idempotency / region-selection logic in catalog.run.
No DB, no LLM, no env vars required — tests pure functions only.
"""

from __future__ import annotations

import pytest

from catalog.run import plan_regions, should_generate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _region(
    postal_prefix: str = "M5V",
    catalog_generated: bool = False,
    created_at: str = "2026-01-01T00:00:00+00:00",
) -> dict:
    return {
        "id": f"region-{postal_prefix}",
        "postal_prefix": postal_prefix,
        "catalog_generated": catalog_generated,
        "created_at": created_at,
    }


# ---------------------------------------------------------------------------
# should_generate
# ---------------------------------------------------------------------------


class TestShouldGenerate:
    def test_pending_region_selected(self):
        r = _region(catalog_generated=False)
        assert should_generate(r, force=False) is True

    def test_generated_region_skipped_without_force(self):
        r = _region(catalog_generated=True)
        assert should_generate(r, force=False) is False

    def test_generated_region_included_with_force(self):
        r = _region(catalog_generated=True)
        assert should_generate(r, force=True) is True

    def test_pending_region_with_force(self):
        r = _region(catalog_generated=False)
        assert should_generate(r, force=True) is True


# ---------------------------------------------------------------------------
# plan_regions
# ---------------------------------------------------------------------------


class TestPlanRegions:
    def test_all_pending_regions_selected(self):
        regions = [_region("M5V"), _region("M5G"), _region("M4Y")]
        result = plan_regions(regions, force=False)
        assert [r["postal_prefix"] for r in result] == ["M5V", "M5G", "M4Y"]

    def test_generated_regions_excluded_without_force(self):
        regions = [
            _region("M5V", catalog_generated=False),
            _region("M5G", catalog_generated=True),
            _region("M4Y", catalog_generated=False),
        ]
        result = plan_regions(regions, force=False)
        assert [r["postal_prefix"] for r in result] == ["M5V", "M4Y"]

    def test_generated_regions_included_with_force(self):
        regions = [
            _region("M5V", catalog_generated=False),
            _region("M5G", catalog_generated=True),
            _region("M4Y", catalog_generated=False),
        ]
        result = plan_regions(regions, force=True)
        assert [r["postal_prefix"] for r in result] == ["M5V", "M5G", "M4Y"]

    def test_max_regions_cap(self):
        regions = [_region(f"M{i}A") for i in range(10)]
        result = plan_regions(regions, force=False, max_regions=3)
        assert len(result) == 3
        assert [r["postal_prefix"] for r in result] == ["M0A", "M1A", "M2A"]

    def test_max_regions_cap_with_some_excluded(self):
        regions = [
            _region("M0A", catalog_generated=True),  # excluded
            _region("M1A", catalog_generated=False),
            _region("M2A", catalog_generated=False),
            _region("M3A", catalog_generated=False),
            _region("M4A", catalog_generated=False),
        ]
        result = plan_regions(regions, force=False, max_regions=2)
        assert len(result) == 2
        assert [r["postal_prefix"] for r in result] == ["M1A", "M2A"]

    def test_ordering_preserved(self):
        # Input is ordered by created_at (caller responsibility);
        # plan_regions must preserve that order.
        regions = [
            _region("M4Y", created_at="2026-01-03T00:00:00+00:00"),
            _region("M5V", created_at="2026-01-01T00:00:00+00:00"),
            _region("M5G", created_at="2026-01-02T00:00:00+00:00"),
        ]
        result = plan_regions(regions, force=False)
        assert [r["postal_prefix"] for r in result] == ["M4Y", "M5V", "M5G"]

    def test_empty_input(self):
        result = plan_regions([], force=False)
        assert result == []

    def test_max_regions_none_returns_all(self):
        regions = [_region(f"X{i}A") for i in range(20)]
        result = plan_regions(regions, force=False, max_regions=None)
        assert len(result) == 20

    def test_max_regions_larger_than_available(self):
        regions = [_region("M5V"), _region("M5G")]
        result = plan_regions(regions, force=False, max_regions=100)
        assert len(result) == 2

    def test_all_generated_no_force_returns_empty(self):
        regions = [
            _region("M5V", catalog_generated=True),
            _region("M5G", catalog_generated=True),
        ]
        result = plan_regions(regions, force=False)
        assert result == []
