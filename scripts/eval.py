"""Run the test questions (CLAUDE.md §11) and write eval/results.md.

Each question goes through the multi-agent graph and through a naive baseline:
the same model with no tools and no Knowledge Base. The comparison shows what
the Knowledge Base and the verifier add.

    uv run python -m scripts.eval              # all questions
    uv run python -m scripts.eval --only 5 7   # a subset (1-based)

The Groq free tier has per-minute token caps, so questions run one at a time
with a pause in between.
"""

import argparse
import asyncio
import time
from datetime import datetime, timezone
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from app.cli import render
from app.errors import AppError, UpstreamBusy
from app.graph.build import graph
from app.llm import get_model

QUESTIONS = [
    "I'm a software developer in Toronto with a full-time job offer. What work permit options do I have?",
    "I graduated from a Canadian college program two years ago. Can I still get a post-graduation work permit?",
    "Does my spouse get an open work permit if I come to Canada on a work permit?",
    "Which Ontario employers received positive LMIAs for software engineers recently?",
    "Do I get extra Express Entry points for a job offer?",
    "Can I get a work permit in Australia as a software engineer?",
    # Carries a commonly repeated, outdated premise: the demo case for the "Changed" callout.
    "I read that a job offer gives me 50 or 200 extra points in Express Entry. Is that still true?",
]

NAIVE_PROMPT = (
    "You answer questions about Canadian work permit and permanent residence pathways for tech "
    "workers. Answer briefly in plain language."
)

OUT = Path(__file__).resolve().parent.parent / "eval" / "results.md"
PAUSE_S = 20  # spread load across Groq's per-minute windows


async def _with_retry(fn):
    try:
        return await fn()
    except UpstreamBusy:
        await asyncio.sleep(60)
        return await fn()


async def run_graph(question: str) -> dict:
    steps: list[str] = []
    final = None
    async for update in graph.astream({"question": question}, stream_mode="updates"):
        for node, delta in update.items():
            note = ""
            if node == "verifier" and delta.get("verifier_notes"):
                note = " (sent back: " + "; ".join(delta["verifier_notes"]) + ")"
            steps.append(node + note)
            if node == "finalize":
                final = delta["final_answer"]
    return {"steps": steps, "answer": final}


async def run_naive(question: str) -> str:
    msg = await get_model("policy").ainvoke([SystemMessage(NAIVE_PROMPT), HumanMessage(question)])
    return msg.content


def _section(n: int, question: str, result: dict | None, naive: str, error: str | None, secs: float) -> str:
    out = [f"## {n}. {question}\n"]
    if error:
        out.append(f"**Maple Route:** error: {error}\n")
    else:
        a = result["answer"]
        statuses: dict[str, int] = {}
        for c in a["claims"]:
            statuses[c["status"]] = statuses.get(c["status"], 0) + 1
        summary = ", ".join(f"{v} {k}" for k, v in sorted(statuses.items())) or "none"
        out.append(
            f"- Time: {secs:.0f}s · verifier revisions: {a['revisions']} · "
            f"claims: {summary} · sources: {len(a['sources'])} · Changed callouts: {len(a['conflicts'])}\n"
            f"- Steps: {' → '.join(result['steps'])}\n"
        )
        out.append("**Maple Route**\n\n```text\n" + render(a) + "\n```\n")
    out.append("**Naive baseline (same model, no tools)**\n\n```text\n" + naive.strip() + "\n```\n")
    return "\n".join(out)


async def main(only: list[int]) -> None:
    picked = [(i, q) for i, q in enumerate(QUESTIONS, 1) if not only or i in only]
    sections = []
    for k, (n, question) in enumerate(picked):
        if k:
            await asyncio.sleep(PAUSE_S)
        print(f"[{n}] {question}")
        start, result, error = time.monotonic(), None, None
        try:
            result = await _with_retry(lambda: run_graph(question))
        except AppError as err:
            error = err.message
        secs = time.monotonic() - start
        await asyncio.sleep(PAUSE_S)
        try:
            naive = await _with_retry(lambda: run_naive(question))
        except AppError as err:
            naive = f"(error: {err.message})"
        sections.append(_section(n, question, result, naive, error, secs))
        print(f"    done in {secs:.0f}s" + (f", error: {error}" if error else ""))

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    header = (
        "# Evaluation results\n\n"
        f"Generated {stamp} by `scripts/eval.py`.\n\n"
        "Each question runs through the Maple Route graph (Knowledge Base, verifier) and through a naive "
        "baseline: the same model with no tools. The baseline answers from the model's own memory, so it "
        "has no citations and can repeat rules that have since changed.\n"
    )
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(header + "\n" + "\n".join(sections))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", type=int, nargs="*", default=[])
    asyncio.run(main(parser.parse_args().only))
