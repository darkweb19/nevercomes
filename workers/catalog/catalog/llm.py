"""
Anthropic client wrapper — structured JSON generation.
Config is loaded LAZILY so tests can import this module without env vars.
"""

from __future__ import annotations

import json
import logging
from typing import Any, TypeVar

from pydantic import BaseModel, ValidationError

from .models import build_json_schema

log = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5"
MAX_TOKENS = 8000
TEMPERATURE = 0.8

T = TypeVar("T", bound=BaseModel)

# Six seeded categories
VALID_CATEGORY_SLUGS = [
    "late-night-eats",
    "gadgets",
    "home-comfort",
    "apparel",
    "groceries",
    "curiosities",
]

SYSTEM_PROMPT = """\
You are a catalog generator for NeverComes, a deadpan parody shopping/delivery site where
orders are placed but nothing ever arrives. The tone is dry, matter-of-fact absurdity —
products are real-sounding but gently broken, vendors are plausible but slightly off.

HARD RULES:
- NO real brand names anywhere. Do not mention Amazon, Uber, DoorDash, Walmart, Starbucks,
  Tim Hortons, Shopify, Apple, Google, or any other real company or brand.
- All names must be fictional, original, and slightly off (e.g. "Perpetual Provisions",
  "Adequate Supply Co.", "Eventually Yours Delivery").
- Prices are integer cents (CAD). Never use floats for price_cents.
- Product ratings are 0.0–5.0. Vendor ratings are 3.5–4.9.
- Options (if any): use parody notes like "+$0.00", "Sold out: Anticipation".
- Descriptions: 1–2 deadpan sentences. Reviews should mention that nothing arrived.
- Respond ONLY with valid JSON matching the provided schema. No extra commentary.
"""


def _get_client() -> Any:
    """Lazily import and construct the Anthropic client."""
    from anthropic import Anthropic  # type: ignore

    from .config import get_settings

    settings = get_settings()
    return Anthropic(api_key=settings.anthropic_api_key)


def call_llm(
    model_class: type[T],
    user_prompt: str,
    usage_accumulator: dict[str, int],
    *,
    extra_system: str = "",
    validation_errors: str | None = None,
) -> T:
    """
    Call Claude with structured JSON output.
    Raises ValueError on max_tokens stop reason.
    Raises ValidationError on bad output (caller should retry once).
    """
    client = _get_client()
    schema = build_json_schema(model_class, model_class.__name__)

    system = SYSTEM_PROMPT
    if extra_system:
        system = f"{system}\n\n{extra_system}"

    messages: list[dict[str, str]] = [{"role": "user", "content": user_prompt}]

    if validation_errors:
        messages.append(
            {
                "role": "user",
                "content": (
                    f"Your previous response had validation errors. Please fix them and try again.\n"
                    f"Errors:\n{validation_errors}"
                ),
            }
        )

    log.debug("Calling %s for %s", MODEL, model_class.__name__)

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        system=system,
        messages=messages,
        output_config={"format": {"type": "json_schema", "schema": schema}},
    )

    # Accumulate token usage
    if hasattr(response, "usage") and response.usage:
        usage_accumulator["input_tokens"] = (
            usage_accumulator.get("input_tokens", 0) + response.usage.input_tokens
        )
        usage_accumulator["output_tokens"] = (
            usage_accumulator.get("output_tokens", 0) + response.usage.output_tokens
        )

    if response.stop_reason == "max_tokens":
        raise ValueError(
            f"LLM response was truncated (stop_reason=max_tokens). "
            f"Consider reducing the requested output size."
        )

    raw_text = response.content[0].text
    raw_json = json.loads(raw_text)
    return model_class.model_validate(raw_json)


def call_llm_with_retry(
    model_class: type[T],
    user_prompt: str,
    usage_accumulator: dict[str, int],
    *,
    extra_system: str = "",
) -> T:
    """
    Call LLM with one retry on pydantic validation failure.
    Appends validation errors to the retry prompt.
    Raises on second failure.
    """
    try:
        return call_llm(
            model_class,
            user_prompt,
            usage_accumulator,
            extra_system=extra_system,
        )
    except (ValidationError, ValueError, json.JSONDecodeError) as first_error:
        log.warning(
            "First LLM call for %s failed (%s), retrying once.",
            model_class.__name__,
            type(first_error).__name__,
        )
        # Retry with validation errors appended
        return call_llm(
            model_class,
            user_prompt,
            usage_accumulator,
            extra_system=extra_system,
            validation_errors=str(first_error),
        )
