"""Daily answer budget, per-IP limit, and answer cache (CLAUDE.md §7).

Uses Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are set, otherwise an
in-process store (fine locally; on Vercel each instance would count separately).
Keys hold only hashes and counters; cached values hold only the final answer.
"""

import hashlib
import ipaddress
import json
import os
import re
import time
from datetime import UTC, datetime, timedelta
from typing import Protocol

from app.config import settings


class Store(Protocol):
    async def incr(self, key: str, ttl_s: int) -> int: ...
    async def decr(self, key: str) -> int: ...
    async def get(self, key: str) -> str | None: ...
    async def set(self, key: str, value: str, ttl_s: int) -> None: ...


class MemoryStore:
    def __init__(self) -> None:
        self._data: dict[str, tuple[float, str]] = {}

    def _live(self, key: str) -> str | None:
        item = self._data.get(key)
        if item and item[0] > time.time():
            return item[1]
        self._data.pop(key, None)
        return None

    async def incr(self, key: str, ttl_s: int) -> int:
        current = self._live(key)
        expires = self._data[key][0] if current is not None else time.time() + ttl_s
        value = int(current or 0) + 1
        self._data[key] = (expires, str(value))
        return value

    async def decr(self, key: str) -> int:
        current = self._live(key)
        if current is None:
            return 0
        value = int(current) - 1
        self._data[key] = (self._data[key][0], str(value))
        return value

    async def get(self, key: str) -> str | None:
        return self._live(key)

    async def set(self, key: str, value: str, ttl_s: int) -> None:
        self._data[key] = (time.time() + ttl_s, value)


class UpstashStore:
    def __init__(self, url: str, token: str) -> None:
        from upstash_redis.asyncio import Redis

        self._r = Redis(url=url, token=token, allow_telemetry=False)

    async def incr(self, key: str, ttl_s: int) -> int:
        value = await self._r.incr(key)
        if value == 1:
            await self._r.expire(key, ttl_s)
        return value

    async def decr(self, key: str) -> int:
        return await self._r.decr(key)

    async def get(self, key: str) -> str | None:
        return await self._r.get(key)

    async def set(self, key: str, value: str, ttl_s: int) -> None:
        await self._r.set(key, value, ex=ttl_s)


def _make_store() -> Store:
    # The Vercel Marketplace integration names these KV_REST_API_URL/TOKEN.
    url = os.getenv("UPSTASH_REDIS_REST_URL") or os.getenv("KV_REST_API_URL")
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN") or os.getenv("KV_REST_API_TOKEN")
    return UpstashStore(url, token) if url and token else MemoryStore()


store: Store = _make_store()


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


# --- daily answer budget (resets at midnight UTC) ------------------------------

def _day_key() -> str:
    return "answers:" + datetime.now(UTC).strftime("%Y-%m-%d")


def resets_at() -> str:
    tomorrow = datetime.now(UTC).date() + timedelta(days=1)
    return datetime(tomorrow.year, tomorrow.month, tomorrow.day, tzinfo=UTC).isoformat()


async def remaining_today() -> int:
    used = int(await store.get(_day_key()) or 0)
    return max(settings.daily_answer_limit - used, 0)


async def reserve_answer() -> int | None:
    """Take one answer from today's budget; None if it's used up. Returns what's left."""
    used = await store.incr(_day_key(), ttl_s=2 * 86400)
    if used > settings.daily_answer_limit:
        await store.decr(_day_key())
        return None
    return settings.daily_answer_limit - used


async def refund_answer() -> None:
    """A run that failed before answering shouldn't use up the budget."""
    await store.decr(_day_key())


# --- per-IP limits (hourly and daily) -----------------------------------------

def client_key(ip: str) -> str:
    """One IPv6 subscriber usually holds a whole /64, so count the /64 rather than each address."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return ip
    if isinstance(addr, ipaddress.IPv6Address):
        if addr.ipv4_mapped:
            return str(addr.ipv4_mapped)
        return str(ipaddress.ip_network(f"{addr}/64", strict=False))
    return str(addr)


async def allow_ip(ip: str) -> bool:
    who = _hash(client_key(ip))[:24]
    now = datetime.now(UTC)
    if await store.incr(f"ip:{who}:{now:%Y-%m-%dT%H}", ttl_s=3600) > settings.per_ip_hourly_limit:
        return False
    # The daily cap keeps one visitor from using most of the shared daily budget.
    return await store.incr(f"ipday:{who}:{now:%Y-%m-%d}", ttl_s=86400) <= settings.per_ip_daily_limit


# --- answer cache -------------------------------------------------------------

def normalize(question: str) -> str:
    return re.sub(r"\s+", " ", question.strip().lower())


def _cache_key(question: str) -> str:
    return "answer:" + _hash(normalize(question))


async def cached_answer(question: str) -> dict | None:
    raw = await store.get(_cache_key(question))
    return json.loads(raw) if raw else None


async def cache_answer(question: str, answer: dict) -> None:
    await store.set(_cache_key(question), json.dumps(answer), ttl_s=settings.cache_ttl_hours * 3600)
