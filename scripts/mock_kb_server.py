"""Local stand-in for the Sanity Context MCP endpoint in Knowledge Base mode.

Serves the two documented KB-mode tools (initial_context, knowledge_base_read)
from tests/fixtures/kb so agents can be built before the real KB exists.
Development only: refuses to start on Vercel.

    uv run python scripts/mock_kb_server.py      # http://127.0.0.1:8765/mcp
"""

import os
import sys
from pathlib import Path

from mcp.server.fastmcp import FastMCP

if os.getenv("VERCEL"):
    sys.exit("mock_kb_server must not run in deployed environments")

KB_ID = "kbMOCK0001"
FIXTURES = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "kb"

mcp = FastMCP("maple-route-mock-kb", host="127.0.0.1", port=8765)


@mcp.tool()
def initial_context() -> str:
    """Return the outline of each Knowledge Base served by this endpoint."""
    return (FIXTURES / "_outline.md").read_text()


@mcp.tool()
def knowledge_base_read(knowledgeBase: str, paths: list[str]) -> str:
    """Return the full content of the given entries (1-20 paths)."""
    if knowledgeBase != KB_ID:
        return f"Unknown knowledge base: {knowledgeBase}"
    if not 1 <= len(paths) <= 20:
        return "paths must contain 1-20 entries"
    parts = []
    for path in paths:
        file = FIXTURES / (path.strip("/").replace("/", "__") + ".md")
        if file.is_file():
            parts.append(f"<entry path=\"{path}\">\n{file.read_text()}</entry>")
        else:
            parts.append(f"<entry path=\"{path}\">Not found</entry>")
    return "\n\n".join(parts)


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
