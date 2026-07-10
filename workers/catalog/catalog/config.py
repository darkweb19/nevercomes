"""
Configuration — reads from environment with dotenv fallback.
Config loading is LAZY (only when get_settings() is called), never at module import time,
so tests can import this module without setting env vars.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_service_role_key: str
    anthropic_api_key: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Load settings once, cache for the process lifetime."""
    # Only load dotenv here, not at module import time
    try:
        from dotenv import load_dotenv  # type: ignore

        # Look for .env in the workers/catalog directory (sibling of this package)
        import pathlib

        env_path = pathlib.Path(__file__).parent.parent / ".env"
        if env_path.exists():
            load_dotenv(env_path)
    except ImportError:
        pass  # python-dotenv not installed — rely on os env

    missing: list[str] = []
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")

    if not supabase_url:
        missing.append("SUPABASE_URL")
    if not supabase_key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if not anthropic_key:
        missing.append("ANTHROPIC_API_KEY")

    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            "Copy workers/catalog/.env.example to workers/catalog/.env and fill in values."
        )

    return Settings(
        supabase_url=supabase_url,
        supabase_service_role_key=supabase_key,
        anthropic_api_key=anthropic_key,
    )
