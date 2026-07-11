"""
Pydantic v2 models for the catalog worker.
These are used both for LLM output validation and for the DB upsert payload.

Numeric bounds (min/max) and string lengths are enforced HERE in pydantic,
not in the JSON schema passed to the LLM (because the Anthropic structured-output
API does not support numeric min/max or string minLength/maxLength constraints).
"""

from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field, StrictInt, field_validator


# ---------------------------------------------------------------------------
# Options (jsonb shape for products.options)
# ---------------------------------------------------------------------------


class OptionChoice(BaseModel):
    """A single selectable choice within an option group."""

    model_config = {"extra": "forbid"}

    label: str
    note: str | None = None


class OptionGroup(BaseModel):
    """One option group (e.g. 'Size', 'Extras')."""

    model_config = {"extra": "forbid"}

    name: str
    kind: Literal["single", "multi"]
    choices: list[OptionChoice]


# ---------------------------------------------------------------------------
# Vendor
# ---------------------------------------------------------------------------

VENDOR_RATING_MIN = 3.5
VENDOR_RATING_MAX = 4.9


class VendorInput(BaseModel):
    """LLM-generated vendor (before DB insertion)."""

    model_config = {"extra": "forbid"}

    name: str
    kind: Literal["store", "restaurant"]
    rating: float
    tagline: str

    @field_validator("rating")
    @classmethod
    def validate_vendor_rating(cls, v: float) -> float:
        if v < VENDOR_RATING_MIN or v > VENDOR_RATING_MAX:
            raise ValueError(
                f"Vendor rating must be between {VENDOR_RATING_MIN} and {VENDOR_RATING_MAX}, got {v}"
            )
        return round(v, 1)


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

PRICE_CENTS_MIN = 200
PRICE_CENTS_MAX = 250_000
PRODUCT_RATING_MIN = 0.0
PRODUCT_RATING_MAX = 5.0


class ProductInput(BaseModel):
    """LLM-generated product (before DB insertion)."""

    model_config = {"extra": "forbid"}

    vendor_index: int  # 0-based index into the vendors list
    category_slug: str  # must match one of the six seeded slugs
    name: str
    description: str
    price_cents: StrictInt  # rejects floats; validated further below
    rating: float
    options: list[OptionGroup] = Field(default_factory=list)

    @field_validator("price_cents")
    @classmethod
    def validate_price(cls, v: int) -> int:
        if v < PRICE_CENTS_MIN or v > PRICE_CENTS_MAX:
            raise ValueError(
                f"price_cents must be between {PRICE_CENTS_MIN} and {PRICE_CENTS_MAX}, got {v}"
            )
        return v

    @field_validator("rating")
    @classmethod
    def validate_product_rating(cls, v: float) -> float:
        if v < PRODUCT_RATING_MIN or v > PRODUCT_RATING_MAX:
            raise ValueError(
                f"Product rating must be between {PRODUCT_RATING_MIN} and {PRODUCT_RATING_MAX}, got {v}"
            )
        return round(v, 1)


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------

REVIEW_RATING_MIN = 0.0
REVIEW_RATING_MAX = 5.0


class ReviewInput(BaseModel):
    """LLM-generated review (before DB insertion)."""

    model_config = {"extra": "forbid"}

    product_index: int  # 0-based index into the products list
    author: str  # fictional first name + initial
    rating: float
    body: str

    @field_validator("rating")
    @classmethod
    def validate_review_rating(cls, v: float) -> float:
        if v < REVIEW_RATING_MIN or v > REVIEW_RATING_MAX:
            raise ValueError(
                f"Review rating must be between {REVIEW_RATING_MIN} and {REVIEW_RATING_MAX}, got {v}"
            )
        return round(v, 1)


# ---------------------------------------------------------------------------
# Top-level LLM response bundles
# ---------------------------------------------------------------------------


class VendorBundle(BaseModel):
    """LLM response for the gen_vendors node."""

    model_config = {"extra": "forbid"}

    vendors: list[VendorInput]

    @field_validator("vendors")
    @classmethod
    def validate_count(cls, v: list[VendorInput]) -> list[VendorInput]:
        if len(v) < 5 or len(v) > 8:
            raise ValueError(f"Expected 5–8 vendors, got {len(v)}")
        return v


class ProductBundle(BaseModel):
    """LLM response for the gen_products node."""

    model_config = {"extra": "forbid"}

    products: list[ProductInput]

    @field_validator("products")
    @classmethod
    def validate_count(cls, v: list[ProductInput]) -> list[ProductInput]:
        if len(v) < 20:
            raise ValueError(f"Expected at least 20 products, got {len(v)}")
        return v


class ReviewBundle(BaseModel):
    """LLM response for the gen_reviews node."""

    model_config = {"extra": "forbid"}

    reviews: list[ReviewInput]


# ---------------------------------------------------------------------------
# JSON schema helpers for the Anthropic structured output API
# ---------------------------------------------------------------------------

# Keys that Anthropic's structured-output API does not support
_UNSUPPORTED_KEYS = {"minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "minLength", "maxLength", "minItems", "maxItems"}


def _strip_unsupported(schema: dict) -> dict:  # type: ignore[type-arg]
    """Recursively remove unsupported JSON schema constraint keys and add additionalProperties:false."""
    if not isinstance(schema, dict):
        return schema

    cleaned: dict = {}  # type: ignore[type-arg]
    for k, v in schema.items():
        if k in _UNSUPPORTED_KEYS:
            continue
        if isinstance(v, dict):
            cleaned[k] = _strip_unsupported(v)
        elif isinstance(v, list):
            cleaned[k] = [_strip_unsupported(item) if isinstance(item, dict) else item for item in v]
        else:
            cleaned[k] = v

    # Add additionalProperties: false to object types
    if cleaned.get("type") == "object" and "additionalProperties" not in cleaned:
        cleaned["additionalProperties"] = False

    return cleaned


def build_json_schema(model: type[BaseModel], name: str) -> dict:  # type: ignore[type-arg]
    """Build a cleaned JSON schema suitable for Anthropic structured outputs."""
    raw = model.model_json_schema()
    # model_json_schema() returns the full schema with $defs — we need to inline $defs
    # For the structured output API we pass a flat schema, so we resolve $refs ourselves.
    resolved = _resolve_refs(raw, raw.get("$defs", {}))
    cleaned = _strip_unsupported(resolved)
    cleaned.pop("$defs", None)
    cleaned.pop("title", None)
    cleaned["additionalProperties"] = False
    return cleaned


def _resolve_refs(schema: object, defs: dict) -> object:  # type: ignore[type-arg]
    """Inline all $ref references in the schema."""
    if isinstance(schema, dict):
        if "$ref" in schema:
            ref_name = schema["$ref"].split("/")[-1]
            referenced = defs.get(ref_name, {})
            resolved = _resolve_refs(referenced, defs)
            # Merge any sibling keys (there shouldn't be any in valid JSON Schema, but just in case)
            other = {k: v for k, v in schema.items() if k != "$ref"}
            if other and isinstance(resolved, dict):
                return {**resolved, **other}
            return resolved
        return {k: _resolve_refs(v, defs) for k, v in schema.items()}
    if isinstance(schema, list):
        return [_resolve_refs(item, defs) for item in schema]
    return schema
