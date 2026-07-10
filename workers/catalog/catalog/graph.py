"""
LangGraph pipeline for per-region catalog generation.

Pipeline (linear with one retry edge per LLM node):
  region_brief → gen_vendors → gen_products → gen_reviews → validate → upsert

State carries the full generation bundle so each node can access prior results.
"""

from __future__ import annotations

import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from .blocklist import contains_real_brand, find_real_brand_hits
from .db import (
    delete_vendors_for_region,
    get_category_map,
    get_osm_places,
    insert_catalog_event,
    insert_products,
    insert_reviews,
    insert_vendors,
    mark_catalog_generated,
)
from .llm import MODEL, TEMPERATURE, VALID_CATEGORY_SLUGS, call_llm_with_retry
from .models import (
    ProductBundle,
    ProductInput,
    ReviewBundle,
    ReviewInput,
    VendorBundle,
    VendorInput,
)

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------


class CatalogState(TypedDict, total=False):
    """State bag passed between pipeline nodes."""

    region: dict[str, Any]  # the full region row from Postgres
    categories: dict[str, str]  # slug → category_id map
    brief: str  # text brief composed in region_brief
    vendors: list[VendorInput]
    products: list[ProductInput]
    reviews: list[ReviewInput]
    attempt: int  # retry counter (0 = first attempt)
    usage: dict[str, int]  # accumulated token usage
    error: str | None  # set when a node fails fatally


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------


def node_region_brief(state: CatalogState) -> CatalogState:
    """Build a short text brief from the region row + OSM places. No LLM call."""
    region = state["region"]
    postal_prefix = region["postal_prefix"]
    lat = region.get("centroid_lat") or region.get("city_centroid_lat")
    lng = region.get("centroid_lng") or region.get("city_centroid_lng")

    lines = [
        f"Postal area: {postal_prefix}",
    ]
    if lat and lng:
        lines.append(f"Approximate centre: {lat:.4f}N, {abs(lng):.4f}W")

    # Fetch up to 15 OSM place names for local flavour
    places = get_osm_places(region["id"], limit=15)
    if places:
        names = [p["name"] for p in places if p.get("name")]
        lines.append(f"Nearby places: {', '.join(names[:15])}")

    brief = "\n".join(lines)
    log.info("Region brief for %s:\n%s", postal_prefix, brief)

    # Fetch and cache categories once
    categories = get_category_map(VALID_CATEGORY_SLUGS)
    if not categories:
        log.warning("No categories found in DB — category_id will be null for all products")

    return {
        **state,
        "brief": brief,
        "categories": categories,
        "attempt": 0,
        "usage": {"input_tokens": 0, "output_tokens": 0},
        "error": None,
    }


def node_gen_vendors(state: CatalogState) -> CatalogState:
    """LLM: generate 5–8 fictional vendors for this region."""
    brief = state["brief"]
    usage = state.get("usage", {})

    prompt = f"""Generate a catalog of 5 to 8 fictional vendors for a fictional neighbourhood
delivery and shopping platform.

Region context:
{brief}

Return a JSON object with a "vendors" array. Each vendor must have:
- name: a unique, fictional business name (no real brand names)
- kind: "store" or "restaurant"
- rating: a number between 3.5 and 4.9 (one decimal place)
- tagline: a short deadpan tagline (e.g. "Delivery pending. Always.")

Mix stores and restaurants. Names should be original and slightly absurd but plausible
(e.g. "Perpetual Provisions", "Adequate Meals Co.", "The Waiting Room Bistro").
"""

    bundle = call_llm_with_retry(VendorBundle, prompt, usage)
    log.info("Generated %d vendors", len(bundle.vendors))
    return {**state, "vendors": bundle.vendors, "usage": usage}


def node_gen_products(state: CatalogState) -> CatalogState:
    """LLM: generate ~40 products spread across the vendors."""
    brief = state["brief"]
    vendors = state["vendors"]
    usage = state.get("usage", {})

    vendor_list = "\n".join(
        f"  [{i}] {v.name} ({v.kind})" for i, v in enumerate(vendors)
    )
    slug_list = ", ".join(VALID_CATEGORY_SLUGS)

    prompt = f"""Generate approximately 40 products for this fictional delivery/shopping platform.

Region context:
{brief}

Available vendors (use vendor_index 0-{len(vendors)-1}):
{vendor_list}

Available category slugs (pick ONE per product): {slug_list}

Return a JSON object with a "products" array. Each product must have:
- vendor_index: integer index from the list above
- category_slug: one of the slugs listed above
- name: fictional product name
- description: 1-2 deadpan sentences about the product
- price_cents: integer in CAD cents (200 to 250000)
- rating: 0.0 to 5.0 (one decimal place)
- options: array of option groups (most products: [], a few with 1-2 groups)

Option group shape: {{"name": "...", "kind": "single" or "multi", "choices": [{{"label": "...", "note": "..."}}]}}
For ~5 products, add one or two option groups with parody notes like "+$0.00" or "Sold out: Anticipation".

Spread products across all vendors. Include a full range of price points.
No real brand names anywhere.
"""

    bundle = call_llm_with_retry(ProductBundle, prompt, usage)
    log.info("Generated %d products", len(bundle.products))
    return {**state, "products": bundle.products, "usage": usage}


def node_gen_reviews(state: CatalogState) -> CatalogState:
    """LLM: generate 1–3 reviews for ~half the products."""
    products = state["products"]
    usage = state.get("usage", {})

    # Pick ~half the products to review
    review_targets = products[::2]  # every other product = ~half
    product_list = "\n".join(
        f"  [{i*2}] {p.name}" for i, p in enumerate(review_targets)
    )

    prompt = f"""Generate 1 to 3 reviews for each of the following products.

Products to review (use product_index from the original list):
{product_list}

Return a JSON object with a "reviews" array. Each review must have:
- product_index: integer index into the original products array (0-based, even numbers above)
- author: a fictional name (first name + last initial, e.g. "Sandra P.", "Marcus T.")
- rating: 0.0 to 5.0 (one decimal place)
- body: deadpan review body — often mentioning that the product never arrived,
  the delivery is still "on its way", or expressing resigned acceptance

No real brand names. Keep tone dry and matter-of-fact.
"""

    bundle = call_llm_with_retry(ReviewBundle, prompt, usage)
    log.info("Generated %d reviews", len(bundle.reviews))
    return {**state, "reviews": bundle.reviews, "usage": usage}


def node_validate(state: CatalogState) -> CatalogState:
    """
    Pydantic re-validation + real-brand blocklist scan.
    If validation fails: increments attempt. The graph routes back to the failing
    gen node (tracked by which item failed) on the first failure, then aborts.
    """
    vendors = state.get("vendors", [])
    products = state.get("products", [])
    reviews = state.get("reviews", [])

    errors: list[str] = []

    # Index bounds — a bad index here would silently drop rows at upsert time,
    # so catch it in validation where the retry path can fix it.
    for i, p in enumerate(products):
        if p.vendor_index < 0 or p.vendor_index >= len(vendors):
            errors.append(f"Product[{i}].vendor_index {p.vendor_index} out of range (0-{len(vendors)-1})")
    for i, r in enumerate(reviews):
        if r.product_index < 0 or r.product_index >= len(products):
            errors.append(f"Review[{i}].product_index {r.product_index} out of range (0-{len(products)-1})")

    # Check vendors
    for i, v in enumerate(vendors):
        for field_name in ("name", "tagline"):
            val = getattr(v, field_name, "")
            if val and contains_real_brand(val):
                hits = find_real_brand_hits(val)
                errors.append(f"Vendor[{i}].{field_name} contains real brand: {hits} in {val!r}")

    # Check products
    for i, p in enumerate(products):
        for field_name in ("name", "description"):
            val = getattr(p, field_name, "")
            if val and contains_real_brand(val):
                hits = find_real_brand_hits(val)
                errors.append(f"Product[{i}].{field_name} contains real brand: {hits} in {val!r}")
        # Check option labels/notes
        for og in p.options:
            for choice in og.choices:
                for fn in ("label", "note"):
                    val = getattr(choice, fn, "") or ""
                    if val and contains_real_brand(val):
                        hits = find_real_brand_hits(val)
                        errors.append(
                            f"Product[{i}].options.{fn} contains real brand: {hits} in {val!r}"
                        )

    # Check reviews
    for i, r in enumerate(reviews):
        for field_name in ("author", "body"):
            val = getattr(r, field_name, "")
            if val and contains_real_brand(val):
                hits = find_real_brand_hits(val)
                errors.append(f"Review[{i}].{field_name} contains real brand: {hits} in {val!r}")

    if errors:
        attempt = state.get("attempt", 0) + 1
        error_summary = "\n".join(errors)
        log.warning("Validation failed (attempt %d):\n%s", attempt, error_summary)
        return {**state, "attempt": attempt, "error": error_summary}

    log.info("Validation passed")
    return {**state, "error": None}


def node_upsert(state: CatalogState) -> CatalogState:
    """Write the generated catalog to Supabase via service_role."""
    region = state["region"]
    region_id = region["id"]
    postal_prefix = region["postal_prefix"]
    vendors = state["vendors"]
    products = state["products"]
    reviews = state["reviews"]
    categories = state.get("categories", {})
    usage = state.get("usage", {"input_tokens": 0, "output_tokens": 0})

    # Serialize vendors for DB insertion
    vendors_raw = [v.model_dump() for v in vendors]
    inserted_vendors = insert_vendors(vendors_raw, region_id)
    vendor_ids = [v["id"] for v in inserted_vendors]
    log.info("Inserted %d vendors", len(vendor_ids))

    # Serialize products for DB insertion. product_ids is position-aligned with
    # products (None where a product was skipped) so review indexes stay correct.
    products_raw = [p.model_dump() for p in products]
    product_ids = insert_products(products_raw, vendor_ids, categories, region_id)
    inserted_product_count = sum(1 for pid in product_ids if pid is not None)
    log.info("Inserted %d products", inserted_product_count)

    # Serialize reviews for DB insertion
    reviews_raw = [r.model_dump() for r in reviews]
    inserted_reviews = insert_reviews(reviews_raw, product_ids)
    review_count = len(inserted_reviews)
    log.info("Inserted %d reviews", review_count)

    # Mark region complete
    mark_catalog_generated(region_id)

    # Record event
    insert_catalog_event(
        region_id=region_id,
        postal_prefix=postal_prefix,
        vendor_count=len(vendor_ids),
        product_count=inserted_product_count,
        review_count=review_count,
        model=MODEL,
        temperature=TEMPERATURE,
        usage=usage,
    )

    log.info(
        "Catalog upsert complete for %s: %d vendors, %d products, %d reviews | tokens: %d in / %d out",
        postal_prefix,
        len(vendor_ids),
        inserted_product_count,
        review_count,
        usage.get("input_tokens", 0),
        usage.get("output_tokens", 0),
    )
    return state


def node_abort(state: CatalogState) -> CatalogState:
    """Fatal abort — called when validation fails twice."""
    region = state.get("region", {})
    error = state.get("error", "unknown error")
    raise RuntimeError(
        f"Catalog generation failed after retries for {region.get('postal_prefix', '?')}: {error}"
    )


# ---------------------------------------------------------------------------
# Router functions (called by add_conditional_edges)
# ---------------------------------------------------------------------------


def route_after_validate(state: CatalogState) -> str:
    """Route to upsert on success, abort on second failure."""
    error = state.get("error")
    if not error:
        return "upsert"
    attempt = state.get("attempt", 0)
    if attempt >= 2:
        return "abort"
    # On first failure, restart generation from vendors
    # (we regenerate everything since brands can cross-contaminate)
    return "gen_vendors"


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------


def build_graph() -> Any:
    """Build and compile the catalog generation graph."""
    builder: StateGraph = StateGraph(CatalogState)  # type: ignore[type-arg]

    builder.add_node("region_brief", node_region_brief)
    builder.add_node("gen_vendors", node_gen_vendors)
    builder.add_node("gen_products", node_gen_products)
    builder.add_node("gen_reviews", node_gen_reviews)
    builder.add_node("validate", node_validate)
    builder.add_node("upsert", node_upsert)
    builder.add_node("abort", node_abort)

    builder.add_edge(START, "region_brief")
    builder.add_edge("region_brief", "gen_vendors")
    builder.add_edge("gen_vendors", "gen_products")
    builder.add_edge("gen_products", "gen_reviews")
    builder.add_edge("gen_reviews", "validate")
    builder.add_conditional_edges(
        "validate",
        route_after_validate,
        {
            "upsert": "upsert",
            "gen_vendors": "gen_vendors",
            "abort": "abort",
        },
    )
    builder.add_edge("upsert", END)
    builder.add_edge("abort", END)

    return builder.compile()


def run_for_region(region: dict[str, Any], force: bool = False) -> dict[str, Any]:
    """
    Run the full pipeline for a single region.
    If force=True, delete existing vendors first (FK cascade clears products/reviews).
    Returns the final state.
    """
    postal_prefix = region["postal_prefix"]
    region_id = region["id"]

    if force:
        log.info("--force: deleting existing catalog for %s", postal_prefix)
        delete_vendors_for_region(region_id)

    graph = build_graph()
    initial_state: CatalogState = {
        "region": region,
        "categories": {},
        "brief": "",
        "vendors": [],
        "products": [],
        "reviews": [],
        "attempt": 0,
        "usage": {"input_tokens": 0, "output_tokens": 0},
        "error": None,
    }
    final_state = graph.invoke(initial_state)
    return final_state
