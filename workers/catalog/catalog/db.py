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


def delete_vendors_for_region(region_id: str) -> None:
    """Delete all vendors for a region (FK cascade wipes products/reviews)."""
    client = _get_client()
    client.table("vendors").delete().eq("region_id", region_id).execute()
    log.info("Deleted vendors for region %s", region_id)


def insert_vendors(
    vendors_data: list[dict[str, Any]], region_id: str
) -> list[dict[str, Any]]:
    """
    Insert vendor rows and return them with their assigned UUIDs.
    Each vendor gets ai_generated=True, locale='en-CA', hero_image=None.
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
    resp = client.table("vendors").insert(rows).execute()
    return resp.data or rows  # fall back to the rows we built if upsert doesn't return data


def insert_products(
    products_data: list[dict[str, Any]],
    vendor_ids: list[str],
    category_map: dict[str, str],
    region_id: str,
) -> list[dict[str, Any]]:
    """
    Insert product rows.
    vendor_index is resolved to vendor_ids[vendor_index].
    category_slug is resolved to category_map[category_slug].
    """
    client = _get_client()
    rows = []
    for p in products_data:
        vendor_index = p["vendor_index"]
        if vendor_index < 0 or vendor_index >= len(vendor_ids):
            log.warning("vendor_index %d out of range, skipping product %s", vendor_index, p.get("name"))
            continue
        vendor_id = vendor_ids[vendor_index]
        category_slug = p.get("category_slug", "")
        category_id = category_map.get(category_slug)  # None if slug not found

        rows.append(
            {
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
        )
    resp = client.table("products").insert(rows).execute()
    return resp.data or rows


def insert_reviews(
    reviews_data: list[dict[str, Any]],
    product_ids: list[str],
) -> list[dict[str, Any]]:
    """
    Insert review rows.
    product_index is resolved to product_ids[product_index].
    """
    client = _get_client()
    rows = []
    for r in reviews_data:
        product_index = r["product_index"]
        if product_index < 0 or product_index >= len(product_ids):
            log.warning("product_index %d out of range, skipping review", product_index)
            continue
        rows.append(
            {
                "id": str(uuid.uuid4()),
                "product_id": product_ids[product_index],
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
