"""
Supabase service_role client + queries/upserts.
Config is loaded LAZILY so tests can import this module without env vars.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

log = logging.getLogger(__name__)


def _get_client() -> Any:
    """Lazily construct the Supabase service_role client."""
    from supabase import create_client  # type: ignore

    from .config import get_settings

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_region_by_prefix(postal_prefix: str) -> dict[str, Any] | None:
    """Fetch a single region row by postal_prefix. Returns None if not found."""
    client = _get_client()
    resp = (
        client.table("regions")
        .select("*")
        .eq("postal_prefix", postal_prefix.upper())
        .limit(1)
        .execute()
    )
    if resp.data:
        return resp.data[0]
    return None


def get_pending_regions(max_regions: int | None = None) -> list[dict[str, Any]]:
    """Return regions where catalog_generated=false, ordered by created_at."""
    client = _get_client()
    query = (
        client.table("regions")
        .select("*")
        .eq("catalog_generated", False)
        .order("created_at")
    )
    if max_regions is not None:
        query = query.limit(max_regions)
    resp = query.execute()
    return resp.data or []


def get_osm_places(region_id: str, limit: int = 15) -> list[dict[str, Any]]:
    """Return up to `limit` OSM places for a region."""
    client = _get_client()
    resp = (
        client.table("osm_places")
        .select("name, kind")
        .eq("region_id", region_id)
        .limit(limit)
        .execute()
    )
    return resp.data or []


def get_category_map(slugs: list[str]) -> dict[str, str]:
    """Return a mapping of category_slug → category_id for the given slugs."""
    client = _get_client()
    resp = client.table("categories").select("id, slug").in_("slug", slugs).execute()
    return {row["slug"]: row["id"] for row in (resp.data or [])}


def insert_region(row: dict[str, Any]) -> dict[str, Any]:
    """Insert a regions row (used by preseed). Returns the created row."""
    client = _get_client()
    resp = client.table("regions").insert(row).execute()
    if not resp.data:
        raise RuntimeError(f"regions insert returned no row for {row.get('postal_prefix')}")
    return resp.data[0]


def delete_vendors_for_region(region_id: str) -> None:
    """Delete all vendors for a region (FK cascade wipes products/reviews)."""
    client = _get_client()
    client.table("vendors").delete().eq("region_id", region_id).execute()
    log.info("Deleted vendors for region %s", region_id)


def insert_vendors(
    vendors_data: list[dict[str, Any]], region_id: str
) -> list[dict[str, Any]]:
    """
    Insert vendor rows and return them (in input order, with their UUIDs).

    IDs are generated client-side, so the returned rows — not the API response,
    whose ordering is not contractually guaranteed — are the source of truth for
    the vendor_index → id mapping.
    """
    client = _get_client()
    rows = [
        {
            "id": str(uuid.uuid4()),
            "name": v["name"],
            "kind": v["kind"],
            "rating": v["rating"],
            # tagline and ai_generated are not columns in the vendors table
            "hero_image": None,
            "locale": "en-CA",
            "region_id": region_id,
        }
        for v in vendors_data
    ]
    client.table("vendors").insert(rows).execute()
    return rows


def insert_products(
    products_data: list[dict[str, Any]],
    vendor_ids: list[str],
    category_map: dict[str, str],
    region_id: str,
) -> list[str | None]:
    """
    Insert product rows and return a list of product ids ALIGNED with
    products_data by position — None where a product was skipped (out-of-range
    vendor_index). Reviews index into products_data positions, so the alignment
    must survive skips or every later review lands on the wrong product.
    """
    client = _get_client()
    rows: list[dict[str, Any]] = []
    ids_by_position: list[str | None] = []
    for p in products_data:
        vendor_index = p["vendor_index"]
        if vendor_index < 0 or vendor_index >= len(vendor_ids):
            log.warning("vendor_index %d out of range, skipping product %s", vendor_index, p.get("name"))
            ids_by_position.append(None)
            continue
        vendor_id = vendor_ids[vendor_index]
        category_slug = p.get("category_slug", "")
        category_id = category_map.get(category_slug)  # None if slug not found

        row = {
            "id": str(uuid.uuid4()),
            "vendor_id": vendor_id,
            "category_id": category_id,
            "name": p["name"],
            "description": p.get("description", ""),
            "price_cents": p["price_cents"],
            "currency": "CAD",
            "rating": p["rating"],
            "image_url": None,
            "options": p.get("options", []),
            "ai_generated": True,
            "region_id": region_id,
        }
        rows.append(row)
        ids_by_position.append(row["id"])
    if rows:
        client.table("products").insert(rows).execute()
    return ids_by_position


def insert_reviews(
    reviews_data: list[dict[str, Any]],
    product_ids: list[str | None],
) -> list[dict[str, Any]]:
    """
    Insert review rows.
    product_index is resolved to product_ids[product_index]; entries that are
    None (their product was skipped) or out of range are dropped.
    """
    client = _get_client()
    rows = []
    for r in reviews_data:
        product_index = r["product_index"]
        if product_index < 0 or product_index >= len(product_ids):
            log.warning("product_index %d out of range, skipping review", product_index)
            continue
        product_id = product_ids[product_index]
        if product_id is None:
            log.warning("product_index %d points at a skipped product, skipping review", product_index)
            continue
        rows.append(
            {
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "author": r["author"],
                "rating": r["rating"],
                "body": r["body"],
                "ai_generated": True,
            }
        )
    if not rows:
        return []
    resp = client.table("reviews").insert(rows).execute()
    return resp.data or rows


def mark_catalog_generated(region_id: str) -> None:
    """Set regions.catalog_generated = true for the given region."""
    client = _get_client()
    client.table("regions").update({"catalog_generated": True}).eq("id", region_id).execute()
    log.info("Marked region %s as catalog_generated=true", region_id)


def insert_catalog_event(
    region_id: str,
    postal_prefix: str,
    vendor_count: int,
    product_count: int,
    review_count: int,
    model: str,
    temperature: float,
    usage: dict[str, int],
) -> None:
    """Insert an events row recording this catalog generation run."""
    client = _get_client()
    client.table("events").insert(
        {
            "id": str(uuid.uuid4()),
            "profile_id": None,
            "session_id": "worker:catalog",
            "type": "catalog_generated",
            "payload": {
                "postal_prefix": postal_prefix,
                "region_id": region_id,
                "vendor_count": vendor_count,
                "product_count": product_count,
                "review_count": review_count,
                "model": model,
                "temperature": temperature,
                "usage": usage,
            },
        }
    ).execute()
