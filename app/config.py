"""Environment-backed settings. Secrets are read here and nowhere else."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _int(name: str, default: int) -> int:
    value = os.getenv(name)
    return int(value) if value else default


@dataclass(frozen=True)
class Settings:
    policy_mcp_url: str | None = os.getenv("SANITY_POLICY_MCP_URL") or None
    employer_mcp_url: str | None = os.getenv("SANITY_EMPLOYER_MCP_URL") or None
    sanity_read_token: str | None = os.getenv("SANITY_READ_TOKEN") or None
    mcp_transport: str = os.getenv("SANITY_MCP_TRANSPORT", "streamable_http")

    groq_api_key: str | None = os.getenv("GROQ_API_KEY") or None

    daily_answer_limit: int = _int("DAILY_ANSWER_LIMIT", 30)
    per_ip_hourly_limit: int = _int("PER_IP_HOURLY_LIMIT", 5)
    per_ip_daily_limit: int = _int("PER_IP_DAILY_LIMIT", 8)
    cache_ttl_hours: int = _int("CACHE_TTL_HOURS", 12)

    # External-call guardrails (CLAUDE.md §10)
    http_timeout_s: float = 15.0
    max_tool_calls_per_agent: int = 6


settings = Settings()
