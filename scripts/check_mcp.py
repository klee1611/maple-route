"""Phase 0 connection check.

Lists tools on each configured MCP endpoint, runs a sample Policy KB read,
and makes one Groq call.

    uv run python scripts/check_mcp.py              # uses .env
    uv run python scripts/check_mcp.py --mock       # against scripts/mock_kb_server.py
"""

import argparse
import asyncio
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv()


def _text(result) -> str:
    """MCP tool results arrive as a string or a list of content blocks."""
    if isinstance(result, str):
        return result
    if isinstance(result, list):
        return "\n".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in result)
    return str(result)


async def check_endpoints() -> bool:
    from app.mcp.client import make_client

    ok = True
    for transport in ("streamable_http", "sse"):
        try:
            client = make_client(transport)
            for name in client.connections:
                tools = await client.get_tools(server_name=name)
                print(f"[{name}] {transport}: {len(tools)} tools")
                for t in tools:
                    print(f"  - {t.name}: {(t.description or '').splitlines()[0][:90]}")
            os.environ["SANITY_MCP_TRANSPORT"] = transport
            break
        except Exception as exc:  # noqa: BLE001 — report and try the next transport
            print(f"{transport} failed: {type(exc).__name__}: {exc}")
    else:
        return False

    client = make_client(transport)
    if "policy" in client.connections:
        tools = {t.name: t for t in await client.get_tools(server_name="policy")}
        outline = _text(await tools["initial_context"].ainvoke({}))
        print("\n--- Policy outline (first 800 chars) ---\n" + outline[:800])
        kb_ids = re.findall(r"\bkb[A-Za-z0-9_-]+", outline)
        paths = [  # entries, not folders
            p for p in re.findall(r"^\s*-\s*([\w./-]+?)\s+(?:\[core\]|—)", outline, re.M)
            if not p.endswith("/")
        ]
        if not (kb_ids and paths):
            print("\nCould not parse a KB id/entry path from the outline; read it above.")
            return False
        entry = _text(await tools["knowledge_base_read"].ainvoke(
            {"knowledgeBase": kb_ids[0], "paths": [paths[0]]}
        ))
        print(f"\n--- knowledge_base_read({kb_ids[0]}, [{paths[0]}]) ---\n{entry[:1500]}")
        has_citation = bool(re.search(r"https?://", entry))
        print(f"\nCitation URL present: {has_citation}")
        ok = ok and has_citation
    return ok


async def check_groq() -> bool:
    from app.llm import get_model

    try:
        reply = await get_model("orchestrator").ainvoke("Reply with the single word: ok")
        print(f"\nGroq ({os.getenv('MODEL_ORCHESTRATOR')}): {reply.content!r}")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"\nGroq call failed: {type(exc).__name__}: {exc}")
        return False


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mock", action="store_true", help="use the local mock KB server")
    parser.add_argument("--skip-groq", action="store_true")
    args = parser.parse_args()
    if args.mock:
        os.environ["SANITY_POLICY_MCP_URL"] = "http://127.0.0.1:8765/mcp"
        os.environ.pop("SANITY_EMPLOYER_MCP_URL", None)
        os.environ.pop("SANITY_READ_TOKEN", None)

    results = {"mcp": await check_endpoints()}
    if not args.skip_groq:
        results["groq"] = await check_groq()
    print("\n" + "  ".join(f"{k}: {'PASS' if v else 'FAIL'}" for k, v in results.items()))
    return 0 if all(results.values()) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
