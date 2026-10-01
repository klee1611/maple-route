"""HTTP API (CLAUDE.md §6): POST /api/ask streams Server-Sent Events; GET /api/quota."""

import asyncio
import json
import logging
import time
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request
from langchain_core.callbacks import UsageMetadataCallbackHandler
from langchain_core.tracers.langchain import wait_for_all_tracers
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app import limits, turnstile
from app.errors import AppError, QuotaExhausted
from app.graph.build import graph
from app.graph.nodes import DISCLAIMER

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("maple_route")

app = FastAPI(title="Maple Route API", docs_url=None, redoc_url=None)

MAX_QUESTION_CHARS = 1000

# Plain-language progress for the timeline; finalize is internal and not shown.
STEP_LABELS = {
    "orchestrator": "Understanding your situation",
    "policy_agent": "Checking current rules",
    "synthesizer": "Writing the answer",
    "verifier": "Verifying sources",
}


class AskBody(BaseModel):
    question: str
    turnstileToken: str = ""


def _event(name: str, data: dict) -> dict:
    return {"event": name, "data": json.dumps(data, ensure_ascii=False)}


def _error(code: str, message: str) -> dict:
    return _event("error", {"code": code, "message": message})


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")


def _finished_summary(node: str, result: dict) -> str:
    if node == "orchestrator":
        n = len(result.get("premises", []))
        return "Understood your question" + (f" and {n} rule{'s' if n != 1 else ''} you mentioned" if n else "")
    if node == "policy_agent":
        n = len(result.get("sources", {}))
        return f"Read {n} Knowledge Base entr{'ies' if n != 1 else 'y'}"
    if node == "synthesizer":
        return "Drafted the answer"
    if node == "verifier":
        if result.get("verifier_notes"):
            return "Found a rule that changed — rechecking"
        return f"Checked {len(result.get('claims', []))} statements against their sources"
    return ""


def _answer_payload(final: dict) -> dict:
    return {
        "text": final["text"], "claims": final["claims"], "conflicts": final["conflicts"],
        "sources": final["sources"], "disclaimer": final["disclaimer"], "revisions": final["revisions"],
    }


async def _run(question: str, ip: str, token: str) -> AsyncIterator[dict]:
    if not question:
        yield _error("invalid_input", "Please type a question first.")
        return
    if len(question) > MAX_QUESTION_CHARS:
        yield _error("invalid_input", f"Please shorten your question to {MAX_QUESTION_CHARS} characters or fewer.")
        return
    if not await turnstile.verify(token, ip):
        yield _error("invalid_input", "We couldn't confirm you're not a bot. Please reload the page and try again.")
        return

    if cached := await limits.cached_answer(question):
        yield _event("answer", {**cached, "cached": True})
        yield _event("quota", {"remainingToday": await limits.remaining_today()})
        return

    if not await limits.allow_ip(ip):
        yield _error("rate_limited", "You've asked several questions in the last hour. Please try again later.")
        return
    remaining = await limits.reserve_answer()
    if remaining is None:
        yield _error("quota_exhausted", QuotaExhausted.message)
        yield _event("quota", {"remainingToday": 0, "resetsAt": limits.resets_at()})
        return

    usage = UsageMetadataCallbackHandler()
    started = time.monotonic()
    final = None
    current = "orchestrator"
    try:
        config = {"callbacks": [usage], "run_name": "ask", "metadata": {"surface": "api"}}
        async for mode, chunk in graph.astream({"question": question}, config, stream_mode=["tasks", "custom"]):
            if mode == "custom" and chunk.get("type") == "waiting":
                yield _event("step", {"agent": current, "status": "waiting",
                                      "summary": f"The free AI service is busy — waiting {chunk['seconds']} seconds"})
                continue
            if mode != "tasks" or chunk["name"] not in STEP_LABELS | {"finalize": ""}:
                continue
            node = chunk["name"]
            if "result" not in chunk:  # task started
                current = node
                if node in STEP_LABELS:
                    yield _event("step", {"agent": node, "status": "started", "summary": STEP_LABELS[node]})
                continue
            result = chunk["result"] or {}
            if node == "finalize":
                final = result["final_answer"]
                continue
            yield _event("step", {"agent": node, "status": "finished", "summary": _finished_summary(node, result)})
            if node == "verifier":
                for claim in result.get("claims", []):
                    yield _event("claim", claim)
    except AppError as exc:
        await limits.refund_answer()
        yield _error(exc.code, exc.message)
        return
    except Exception as exc:  # noqa: BLE001 — never leak internals to the client
        await limits.refund_answer()
        log.exception("run failed: %s", type(exc).__name__)
        yield _error("internal", AppError.message)
        return
    finally:
        await asyncio.to_thread(wait_for_all_tracers)  # serverless: flush traces before returning

    tokens = sum(u.get("total_tokens", 0) for u in usage.usage_metadata.values())
    log.info("answer done tokens=%d revisions=%d seconds=%.1f",
             tokens, final["revisions"], time.monotonic() - started)
    payload = _answer_payload(final)
    await limits.cache_answer(question, payload)
    yield _event("answer", payload)
    yield _event("quota", {"remainingToday": remaining})


@app.post("/api/ask")
async def ask(body: AskBody, request: Request) -> EventSourceResponse:
    return EventSourceResponse(_run(body.question.strip(), _client_ip(request), body.turnstileToken))


@app.get("/api/quota")
async def quota() -> dict:
    return {"remainingToday": await limits.remaining_today(), "resetsAt": limits.resets_at()}


@app.get("/api/health")
async def health() -> dict:
    return {"ok": True, "disclaimer": DISCLAIMER}
