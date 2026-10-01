"""Policy Knowledge Base access over Context MCP: outline (cached) and entry reads."""

import re
import time
from typing import TypedDict

from app.mcp.client import make_client

_OUTLINE_TTL_S = 600
_outline: tuple[float, str] | None = None

# Keep each entry well inside the Groq free tier's 8K tokens/minute (D7).
MAX_ENTRY_CHARS = 6000


def _text(result) -> str:
    return "\n".join(getattr(block, "text", "") for block in result.content)


async def _call(calls: list[tuple[str, dict]]) -> list[str]:
    """Run tool calls in order over one MCP session (one handshake, no parallel connects)."""
    async with make_client().session("policy") as session:
        return [_text(await session.call_tool(name, args)) for name, args in calls]


async def outline() -> str:
    global _outline
    if _outline and time.monotonic() - _outline[0] < _OUTLINE_TTL_S:
        return _outline[1]
    [text] = await _call([("initial_context", {})])
    _outline = (time.monotonic(), text)
    return text


class Citation(TypedDict):
    title: str          # "<page title> § <section path>"
    url: str | None     # the KB includes a URL for some sources only
    date: str | None    # a date found in the section path, e.g. "April 23, 2026"


# "N. <page> | <site> § <section › path> — Web · https://…"  (URL part optional)
_SOURCE_LINE = re.compile(r"^(\d+)\.\s+(.+?)\s+—\s+\w+(?:\s+·\s+(https?://\S+))?\s*$", re.M)
_DATE = re.compile(r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
                   r" \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2}")


def _split_sources(entry: str) -> tuple[str, str]:
    i = entry.rfind("\n## Sources")
    return (entry, "") if i < 0 else (entry[:i], entry[i:])


def citations(entry: str) -> dict[int, Citation]:
    """Parse an entry's trailing "## Sources" list: citation number -> source."""
    out: dict[int, Citation] = {}
    for m in _SOURCE_LINE.finditer(_split_sources(entry)[1]):
        dates = _DATE.findall(m[2])
        out[int(m[1])] = Citation(title=m[2], url=m[3], date=dates[-1] if dates else None)
    return out


def trim(entry: str) -> str:
    """Shorten the body to fit the token budget; never cut the Sources list."""
    body, sources = _split_sources(entry)
    room = max(MAX_ENTRY_CHARS - len(sources), 1000)
    return entry if len(body) <= room else body[:room] + "\n\n[…entry shortened…]\n" + sources


def kb_ids(outline_text: str) -> list[str]:
    return list(dict.fromkeys(re.findall(r"\bkb[A-Za-z0-9_-]+", outline_text)))


async def read(knowledge_base: str, paths: list[str]) -> dict[str, str]:
    """Read entries one call each (keeps entry boundaries unambiguous); path -> trimmed text."""
    texts = await _call([("knowledge_base_read", {"knowledgeBase": knowledge_base, "paths": [p]}) for p in paths])
    return {p: trim(t) for p, t in zip(paths, texts)}
