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
    title: str          # "<page title> § <section path>", or just the page title
    url: str | None     # the KB includes a URL for some sources only
    date: str | None    # a date found in the section path, e.g. "April 23, 2026"


# Entries cite their sources in one of three ways; citation refs are strings ("1", "ab12cd", "source"):
# 1. Footnotes: "statement [^ab12cd]" with definitions after the body:
#    [^ab12cd]: "quoted source text" (Page title - Canada.ca, https://…)
#    trim() rewrites these grouped by page, under "## Sources":  Page: <title> — <url>  /  [^ab12cd]: "quote"
# 2. A numbered "## Sources" list: "N. <page> | <site> § <section › path> — Web · https://…" (URL optional)
# 3. Neither: one line for the whole page, "**Source:** https://…" (or "**Source page:**").
_SOURCE_LINE = re.compile(r"^(\d+)\.\s+(.+?)\s+—\s+\w+(?:\s+·\s+(https?://\S+))?\s*$", re.M)
_FOOTNOTE_DEF = re.compile(r"^\[\^([\w-]+)\]:\s*(.*)$", re.M)
_FOOTNOTE_REF = re.compile(r"\[\^([\w-]+)\](?!:)")
_PAGE_LINE = re.compile(r"^Page: (.+) — (https?://\S+|-)\s*$")
_PAGE_SOURCE = re.compile(r"^\*\*Source(?: page)?:\*\*\s*(https?://\S+)", re.M)
_HEADING = re.compile(r"^# (.+)$", re.M)
_DATE = re.compile(r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
                   r" \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2}")
_QUOTE_CHARS = 150  # footnote quotes are kept for the verifier, shortened to fit the budget


def _split_sources(entry: str) -> tuple[str, str]:
    i = entry.rfind("\n## Sources")
    if i >= 0:
        return entry[:i], entry[i:]
    # Footnote definitions can follow each section rather than sit at the end: pull them all out.
    defs = [m[0] for m in _FOOTNOTE_DEF.finditer(entry)]
    if not defs:
        return entry, ""
    return re.sub(r"\n{3,}", "\n\n", _FOOTNOTE_DEF.sub("", entry)), "\n".join(defs)


def _footnotes(sources: str) -> dict[str, tuple[str, str, str | None]]:
    """Footnote ref -> (quote, page title, url), from raw definitions or trim()'s grouped form."""
    out: dict[str, tuple[str, str, str | None]] = {}
    page: tuple[str, str | None] | None = None
    for line in sources.splitlines():
        if m := _PAGE_LINE.match(line):
            page = (m[1], None if m[2] == "-" else m[2])
        elif m := _FOOTNOTE_DEF.match(line):
            rest = m[2].strip()
            cut = rest.rfind('" (')
            if cut > 0 and rest.endswith(")"):  # raw: "quote" (Title, https://…)
                title, _, url = rest[cut + 3:-1].rpartition(", ")
                if not url.startswith("http"):
                    title, url = rest[cut + 3:-1], None
                # Each URL ends in a "#:~:text=" fragment for its own quote; cite the page itself.
                out[m[1]] = (rest[1:cut], title, url and url.split("#", 1)[0])
            elif page:  # grouped: "quote" under a Page: line
                out[m[1]] = (rest.strip('"'), *page)
    return out


def citations(entry: str) -> dict[str, Citation]:
    """Parse an entry's sources: citation ref -> source."""
    sources = _split_sources(entry)[1]
    out: dict[str, Citation] = {}
    for m in _SOURCE_LINE.finditer(sources):
        dates = _DATE.findall(m[2])
        out[m[1]] = Citation(title=m[2], url=m[3], date=dates[-1] if dates else None)
    for ref, (_, title, url) in _footnotes(sources).items():
        out[ref] = Citation(title=title, url=url, date=None)
    if not out and (m := _PAGE_SOURCE.search(entry)):
        heading = _HEADING.search(entry)
        out["source"] = Citation(title=heading[1].strip() if heading else m[1], url=m[1], date=None)
    return out


def _grouped(refs: list[str], notes: dict[str, tuple[str, str, str | None]]) -> str:
    pages: dict[tuple[str, str | None], list[str]] = {}
    for ref in refs:
        quote, title, url = notes[ref]
        short = quote if len(quote) <= _QUOTE_CHARS else quote[:_QUOTE_CHARS - 1].rstrip() + "…"
        pages.setdefault((title, url), []).append(f'[^{ref}]: "{short}"')
    lines = ["", "", "## Sources"]
    for (title, url), defs in pages.items():
        lines += [f"Page: {title} — {url or '-'}", *defs]
    return "\n".join(lines) + "\n"


def trim(entry: str) -> str:
    """Shorten the body to fit the token budget; keep the citations for what remains."""
    body, sources = _split_sources(entry)
    notes = _footnotes(sources)
    if not notes:
        room = max(MAX_ENTRY_CHARS - len(sources), 1000)
        if len(body) <= room:
            return entry
        # The page's only citation often sits at the very end: set it aside so the cut can't split it.
        page_source = _PAGE_SOURCE.search(body)
        if page_source:
            body = body.replace(page_source[0], "", 1)
        kept = body[:room] + "\n\n[…entry shortened…]\n"
        return kept + (f"\n{page_source[0]}\n" if page_source else "") + sources
    # Footnotes: keep only those the kept text still uses, grouped by page. Find the longest body
    # that fits with its citations (binary search: a longer cut can only add citations).
    def fit(room: int) -> str:
        kept = body if len(body) <= room else body[:room] + "\n\n[…entry shortened…]\n"
        return kept + _grouped([r for r in dict.fromkeys(_FOOTNOTE_REF.findall(kept)) if r in notes], notes)

    lo, hi = 1000, len(body)
    if len(fit(hi)) <= MAX_ENTRY_CHARS:
        return fit(hi)
    while hi - lo > 50:
        mid = (lo + hi) // 2
        lo, hi = (mid, hi) if len(fit(mid)) <= MAX_ENTRY_CHARS else (lo, mid)
    return fit(lo)


def kb_ids(outline_text: str) -> list[str]:
    return list(dict.fromkeys(re.findall(r"\bkb[A-Za-z0-9_-]+", outline_text)))


async def read(knowledge_base: str, paths: list[str]) -> dict[str, str]:
    """Read entries one call each (keeps entry boundaries unambiguous); path -> trimmed text."""
    texts = await _call([("knowledge_base_read", {"knowledgeBase": knowledge_base, "paths": [p]}) for p in paths])
    return {p: trim(t) for p, t in zip(paths, texts)}
