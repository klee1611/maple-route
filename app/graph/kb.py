"""Policy Knowledge Base access over Context MCP: outline (cached) and entry reads."""

import re
import time

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


def kb_ids(outline_text: str) -> list[str]:
    return list(dict.fromkeys(re.findall(r"\bkb[A-Za-z0-9_-]+", outline_text)))


async def read(knowledge_base: str, paths: list[str]) -> dict[str, str]:
    """Read entries one call each (keeps entry boundaries unambiguous); path -> truncated text."""
    texts = await _call([("knowledge_base_read", {"knowledgeBase": knowledge_base, "paths": [p]}) for p in paths])
    return {p: t[:MAX_ENTRY_CHARS] for p, t in zip(paths, texts)}
