"""
Real-brand blocklist.
`contains_real_brand(text)` returns True if any blocklist term appears
as a case-insensitive WHOLE-WORD match in `text`.

Word-boundary matching (not raw substring) because the catalog is full of
legitimate words that contain brand substrings: "cups" ⊃ "ups",
"pineapple" ⊃ "apple", "prime rib" ⊃ "prime". Over-generic terms that are
ordinary English words even as whole words (ups, apple, prime, subway) are
deliberately excluded — the system prompt already forbids real brands; this
list is the safety net for the unambiguous ones.
"""

from __future__ import annotations

import re

BLOCKLIST: list[str] = [
    "amazon",
    "uber",
    "doordash",
    "skipthedishes",
    "skip the dishes",
    "instacart",
    "walmart",
    "costco",
    "ebay",
    "etsy",
    "fedex",
    "dhl",
    "purolator",
    "mcdonald",
    "starbucks",
    "tim hortons",
    "timmies",
    "shopify",
    "google",
    "netflix",
    "coca-cola",
    "pepsi",
    "ikea",
    "loblaws",
    "sobeys",
    "metro inc",
]

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b" + re.escape(term) + r"\b", re.IGNORECASE) for term in BLOCKLIST
]


def contains_real_brand(text: str) -> bool:
    """Return True if `text` contains any real-brand term (case-insensitive, word-boundary)."""
    return any(p.search(text) for p in _PATTERNS)


def find_real_brand_hits(text: str) -> list[str]:
    """Return all blocklist terms found in `text` (for error messages)."""
    return [term for term, p in zip(BLOCKLIST, _PATTERNS) if p.search(text)]
