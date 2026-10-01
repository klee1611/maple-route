"""Ask a question from the terminal.

    uv run python -m app.cli "question"              # multi-agent graph
    uv run python -m app.cli --baseline "question"   # Phase 2 single agent
"""

import argparse
import asyncio


def _cite(claim: dict) -> str:
    if not claim.get("source_url"):
        return "what you mentioned"
    return claim["source_url"] + (f" ({claim['source_date']})" if claim.get("source_date") else "")


def render(answer: dict) -> str:
    out = [answer["text"]]
    for c in answer["conflicts"]:
        old, cur = c["old"], c["current"]
        out.append(f"\n⚠ Changed — {old['note']}\n  Before: {old['text']}\n          {_cite(old)}")
        if cur:
            out.append(f"  Now:    {cur['text']}\n          {_cite(cur)}")
    if answer["sources"]:
        out.append("\nSources")
        out += [f"[{s['n']}] {s['url']}" + (f" ({s['date']})" if s["date"] else "") for s in answer["sources"]]
    out.append(f"\n{answer['disclaimer']}")
    out.append(f"\n(verifier revisions: {answer['revisions']})")
    return "\n".join(out)


async def run_graph(question: str, debug: bool = False) -> None:
    from app.graph.build import graph

    final = None
    async for update in graph.astream({"question": question}, stream_mode="updates"):
        for node, delta in update.items():
            extra = ""
            if node == "verifier" and delta.get("verifier_notes"):
                extra = " → found a problem, rechecking: " + "; ".join(delta["verifier_notes"])
            print(f"· {node} finished{extra}")
            if debug and node in ("orchestrator", "verifier"):
                for c in delta.get("premises", []) + delta.get("claims", []):
                    print(f"    {c['id']} [{c['status']}] {c['text'][:90]} | {c['note']}")
            if node == "finalize":
                final = delta["final_answer"]
    print()
    print(render(final))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("question", nargs="+")
    parser.add_argument("--baseline", action="store_true")
    parser.add_argument("--debug", action="store_true", help="print premises and verifier verdicts")
    args = parser.parse_args()
    question = " ".join(args.question)
    if args.baseline:
        from app.baseline import answer
        print(asyncio.run(answer(question)))
    else:
        asyncio.run(run_graph(question, args.debug))


if __name__ == "__main__":
    main()
