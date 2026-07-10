"""
Pins the review-blocker invariants around the upsert layer (no network):

1. insert_products returns ids POSITION-ALIGNED with its input (None for skipped
   products) so review indexes can never silently point at the wrong product.
2. insert_vendors returns the client-built rows in input order — never trusting
   the API response ordering for the vendor_index → id mapping.
3. insert_reviews drops reviews whose product was skipped or whose index is out
   of range, and maps the rest to the right product ids.
4. delete_vendors_for_region is scoped to one region_id — the NULL-region global
   floor is untouchable by --force.
5. node_validate flags out-of-range vendor_index / product_index so the LLM
   retry path handles them instead of a silent skip at upsert time.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

import catalog.db as db
from catalog.graph import node_validate
from catalog.models import ProductInput, ReviewInput, VendorInput


class FakeQuery:
    def __init__(self, log: list, table: str, reverse_response: bool):
        self.log = log
        self.table = table
        self.reverse_response = reverse_response
        self.op: str | None = None
        self.payload: list | None = None
        self.filters: list = []

    def insert(self, rows):
        self.op = "insert"
        self.payload = rows
        return self

    def delete(self):
        self.op = "delete"
        return self

    def eq(self, col, val):
        self.filters.append((col, val))
        return self

    def execute(self):
        self.log.append(
            {"table": self.table, "op": self.op, "payload": self.payload, "filters": self.filters}
        )
        data = self.payload or []
        if self.reverse_response:
            data = list(reversed(data))
        return SimpleNamespace(data=data)


class FakeClient:
    def __init__(self, reverse_response: bool = False):
        self.log: list = []
        self.reverse_response = reverse_response

    def table(self, name: str):
        return FakeQuery(self.log, name, self.reverse_response)


@pytest.fixture
def fake_client(monkeypatch):
    fc = FakeClient()
    monkeypatch.setattr(db, "_get_client", lambda: fc)
    return fc


def _product(name: str, vendor_index: int) -> dict:
    return {
        "vendor_index": vendor_index,
        "category_slug": "gadgets",
        "name": name,
        "description": "It exists, allegedly.",
        "price_cents": 1999,
        "rating": 4.0,
        "options": [],
    }


class TestInsertProductsAlignment:
    def test_skipped_product_leaves_a_none_gap(self, fake_client):
        products = [_product("A", 0), _product("B", 99), _product("C", 0)]
        ids = db.insert_products(products, ["vendor-1"], {"gadgets": "cat-1"}, "region-1")

        assert len(ids) == 3
        assert ids[0] is not None and ids[2] is not None
        assert ids[1] is None
        inserted = fake_client.log[0]["payload"]
        assert [row["name"] for row in inserted] == ["A", "C"]
        assert ids[0] == inserted[0]["id"] and ids[2] == inserted[1]["id"]

    def test_no_skip_full_alignment(self, fake_client):
        products = [_product("A", 0), _product("B", 0)]
        ids = db.insert_products(products, ["vendor-1"], {}, "region-1")
        assert all(isinstance(i, str) for i in ids)
        assert len(ids) == 2


class TestInsertVendorsOrdering:
    def test_returns_input_order_even_if_response_reordered(self, monkeypatch):
        fc = FakeClient(reverse_response=True)
        monkeypatch.setattr(db, "_get_client", lambda: fc)
        vendors = [
            {"name": "First Provisions", "kind": "store", "rating": 4.1},
            {"name": "Second Pantry", "kind": "restaurant", "rating": 4.5},
        ]
        rows = db.insert_vendors(vendors, "region-1")
        assert [r["name"] for r in rows] == ["First Provisions", "Second Pantry"]
        assert all(r["region_id"] == "region-1" for r in rows)


class TestInsertReviewsMapping:
    def test_skips_none_and_out_of_range(self, fake_client):
        product_ids = ["pid-0", None, "pid-2"]
        reviews = [
            {"product_index": 0, "author": "Sandra P.", "rating": 4.0, "body": "Still waiting."},
            {"product_index": 1, "author": "Marcus T.", "rating": 3.0, "body": "Skipped product."},
            {"product_index": 5, "author": "Ida K.", "rating": 2.0, "body": "Out of range."},
            {"product_index": 2, "author": "Norm B.", "rating": 5.0, "body": "At peace."},
        ]
        inserted = db.insert_reviews(reviews, product_ids)
        assert [r["product_id"] for r in inserted] == ["pid-0", "pid-2"]
        assert [r["author"] for r in inserted] == ["Sandra P.", "Norm B."]


class TestForceDeleteScope:
    def test_delete_scoped_to_region_id(self, fake_client):
        db.delete_vendors_for_region("region-42")
        call = fake_client.log[0]
        assert call["table"] == "vendors"
        assert call["op"] == "delete"
        assert call["filters"] == [("region_id", "region-42")]


class TestValidateIndexBounds:
    def _state(self, products=None, reviews=None):
        vendors = [
            VendorInput(name="Adequate Supply Co.", kind="store", rating=4.0, tagline="Fine.")
        ]
        return {
            "region": {"postal_prefix": "M5V"},
            "vendors": vendors,
            "products": products or [],
            "reviews": reviews or [],
            "attempt": 0,
        }

    def test_out_of_range_vendor_index_flagged(self):
        bad = ProductInput(
            vendor_index=3, category_slug="gadgets", name="A Lamp",
            description="Illuminates nothing yet.", price_cents=4999, rating=4.0,
        )
        result = node_validate(self._state(products=[bad]))
        assert result["error"] is not None
        assert "vendor_index" in result["error"]

    def test_out_of_range_product_index_flagged(self):
        ok = ProductInput(
            vendor_index=0, category_slug="gadgets", name="A Lamp",
            description="Illuminates nothing yet.", price_cents=4999, rating=4.0,
        )
        bad_review = ReviewInput(
            product_index=7, author="Sandra P.", rating=4.0, body="Where is it."
        )
        result = node_validate(self._state(products=[ok], reviews=[bad_review]))
        assert result["error"] is not None
        assert "product_index" in result["error"]

    def test_in_range_passes(self):
        ok = ProductInput(
            vendor_index=0, category_slug="gadgets", name="A Lamp",
            description="Illuminates nothing yet.", price_cents=4999, rating=4.0,
        )
        review = ReviewInput(product_index=0, author="Sandra P.", rating=4.0, body="Waiting.")
        result = node_validate(self._state(products=[ok], reviews=[review]))
        assert result["error"] is None
