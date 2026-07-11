"""
Tests for pydantic model validation (no network, no env vars required).
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from catalog.models import (
    OptionChoice,
    OptionGroup,
    ProductBundle,
    ProductInput,
    ReviewInput,
    VendorBundle,
    VendorInput,
)


# ---------------------------------------------------------------------------
# VendorInput
# ---------------------------------------------------------------------------


class TestVendorInput:
    def _valid(self, **overrides) -> dict:
        base = {"name": "Perpetual Provisions", "kind": "store", "rating": 4.2, "tagline": "It arrives. Eventually."}
        return {**base, **overrides}

    def test_valid_store(self):
        v = VendorInput(**self._valid())
        assert v.name == "Perpetual Provisions"
        assert v.kind == "store"

    def test_valid_restaurant(self):
        v = VendorInput(**self._valid(kind="restaurant"))
        assert v.kind == "restaurant"

    def test_invalid_kind(self):
        with pytest.raises(ValidationError):
            VendorInput(**self._valid(kind="warehouse"))

    def test_rating_too_low(self):
        with pytest.raises(ValidationError):
            VendorInput(**self._valid(rating=3.4))

    def test_rating_too_high(self):
        with pytest.raises(ValidationError):
            VendorInput(**self._valid(rating=5.0))

    def test_rating_min_boundary(self):
        v = VendorInput(**self._valid(rating=3.5))
        assert v.rating == 3.5

    def test_rating_max_boundary(self):
        v = VendorInput(**self._valid(rating=4.9))
        assert v.rating == 4.9

    def test_extra_fields_rejected(self):
        with pytest.raises(ValidationError):
            VendorInput(**self._valid(mystery_field="oops"))


# ---------------------------------------------------------------------------
# ProductInput
# ---------------------------------------------------------------------------


class TestProductInput:
    def _valid(self, **overrides) -> dict:
        base = {
            "vendor_index": 0,
            "category_slug": "groceries",
            "name": "Waiting Room Biscuits",
            "description": "A biscuit that arrives at an indeterminate time.",
            "price_cents": 1299,
            "rating": 3.8,
            "options": [],
        }
        return {**base, **overrides}

    def test_valid(self):
        p = ProductInput(**self._valid())
        assert p.price_cents == 1299

    def test_price_too_low(self):
        with pytest.raises(ValidationError):
            ProductInput(**self._valid(price_cents=199))

    def test_price_too_high(self):
        with pytest.raises(ValidationError):
            ProductInput(**self._valid(price_cents=250_001))

    def test_price_min_boundary(self):
        p = ProductInput(**self._valid(price_cents=200))
        assert p.price_cents == 200

    def test_price_max_boundary(self):
        p = ProductInput(**self._valid(price_cents=250_000))
        assert p.price_cents == 250_000

    def test_price_float_rejected(self):
        """price_cents must be an integer, not a float."""
        with pytest.raises(ValidationError):
            ProductInput(**self._valid(price_cents=12.99))

    def test_rating_too_low(self):
        with pytest.raises(ValidationError):
            ProductInput(**self._valid(rating=-0.1))

    def test_rating_too_high(self):
        with pytest.raises(ValidationError):
            ProductInput(**self._valid(rating=5.1))

    def test_rating_boundaries(self):
        p_low = ProductInput(**self._valid(rating=0.0))
        p_high = ProductInput(**self._valid(rating=5.0))
        assert p_low.rating == 0.0
        assert p_high.rating == 5.0

    def test_options_empty_ok(self):
        p = ProductInput(**self._valid(options=[]))
        assert p.options == []

    def test_options_valid_group(self):
        opts = [{"name": "Size", "kind": "single", "choices": [{"label": "One size"}, {"label": "Also one size", "note": "+$0.00"}]}]
        p = ProductInput(**self._valid(options=opts))
        assert len(p.options) == 1
        assert p.options[0].name == "Size"
        assert p.options[0].choices[1].note == "+$0.00"

    def test_options_bad_kind_rejected(self):
        opts = [{"name": "Size", "kind": "triple", "choices": [{"label": "A"}]}]
        with pytest.raises(ValidationError):
            ProductInput(**self._valid(options=opts))

    def test_options_note_is_optional(self):
        opts = [{"name": "Extras", "kind": "multi", "choices": [{"label": "Waiting"}]}]
        p = ProductInput(**self._valid(options=opts))
        assert p.options[0].choices[0].note is None

    def test_extra_fields_rejected(self):
        with pytest.raises(ValidationError):
            ProductInput(**self._valid(unknown_key="bad"))


# ---------------------------------------------------------------------------
# ReviewInput
# ---------------------------------------------------------------------------


class TestReviewInput:
    def _valid(self, **overrides) -> dict:
        base = {
            "product_index": 0,
            "author": "Sandra P.",
            "rating": 4.0,
            "body": "It hasn't arrived yet. I remain hopeful.",
        }
        return {**base, **overrides}

    def test_valid(self):
        r = ReviewInput(**self._valid())
        assert r.author == "Sandra P."

    def test_rating_too_low(self):
        with pytest.raises(ValidationError):
            ReviewInput(**self._valid(rating=-0.1))

    def test_rating_too_high(self):
        with pytest.raises(ValidationError):
            ReviewInput(**self._valid(rating=5.1))

    def test_rating_boundaries(self):
        r_low = ReviewInput(**self._valid(rating=0.0))
        r_high = ReviewInput(**self._valid(rating=5.0))
        assert r_low.rating == 0.0
        assert r_high.rating == 5.0


# ---------------------------------------------------------------------------
# VendorBundle / ProductBundle
# ---------------------------------------------------------------------------


class TestVendorBundle:
    def _make_vendor(self, name: str = "Some Vendor") -> dict:
        return {"name": name, "kind": "store", "rating": 4.0, "tagline": "Fine."}

    def test_valid_bundle(self):
        vendors = [self._make_vendor(f"V{i}") for i in range(6)]
        bundle = VendorBundle(vendors=vendors)
        assert len(bundle.vendors) == 6

    def test_too_few_vendors_rejected(self):
        vendors = [self._make_vendor(f"V{i}") for i in range(4)]
        with pytest.raises(ValidationError):
            VendorBundle(vendors=vendors)

    def test_too_many_vendors_rejected(self):
        vendors = [self._make_vendor(f"V{i}") for i in range(9)]
        with pytest.raises(ValidationError):
            VendorBundle(vendors=vendors)


class TestProductBundle:
    def _make_product(self, vendor_index: int = 0) -> dict:
        return {
            "vendor_index": vendor_index,
            "category_slug": "groceries",
            "name": "Product",
            "description": "A product.",
            "price_cents": 500,
            "rating": 3.0,
            "options": [],
        }

    def test_valid_bundle(self):
        prods = [self._make_product(i % 5) for i in range(40)]
        bundle = ProductBundle(products=prods)
        assert len(bundle.products) == 40

    def test_too_few_products_rejected(self):
        prods = [self._make_product() for _ in range(19)]
        with pytest.raises(ValidationError):
            ProductBundle(products=prods)
