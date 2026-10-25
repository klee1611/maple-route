"""HTTP API (CLAUDE.md §6): POST /api/ask streams Server-Sent Events; GET /api/quota."""

import asyncio
import json
import logging
import os
import time
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.callbacks import UsageMetadataCallbackHandler
from langchain_core.tracers.langchain import wait_for_all_tracers
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app import limits, turnstile
from app.errors import AppError
from app.graph.build import graph
from app.i18n import Lang, t

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("maple_route")

app = FastAPI(title="Maple Route API", docs_url=None, redoc_url=None)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    # The pages get their headers from next.config.ts; the API is a separate service.
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = response.headers.get("Cache-Control", "no-store")
    return response

if not os.getenv("VERCEL"):
    # Local development only: the Next.js dev server runs on another port. In production
    # the frontend and API share one origin, so no CORS is needed.
    app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["GET", "POST"],
                       allow_headers=["content-type"])

MAX_QUESTION_CHARS = 1000

# Agents shown in the timeline; finalize is internal and not shown.
STEPS = ("orchestrator", "policy_agent", "synthesizer", "verifier")


class AskBody(BaseModel):
    question: str
    turnstileToken: str = ""
    lang: Lang = "en"


def _event(name: str, data: dict) -> dict:
    return {"event": name, "data": json.dumps(data, ensure_ascii=False)}


def _error(code: str, message: str) -> dict:
    return _event("error", {"code": code, "message": message})


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")


def _finished_summary(node: str, result: dict, lang: Lang) -> str:
    if node == "orchestrator":
        n = len(result.get("premises", []))
        if n:
            return t("done.orchestrator.premises", lang, n=n, s="s" if n != 1 else "")
        return t("done.orchestrator", lang)
    if node == "policy_agent":
        n = len(result.get("sources", {}))
        return t("done.policy_agent", lang, n=n, ies="ies" if n != 1 else "y")
    if node == "synthesizer":
        return t("done.synthesizer", lang)
    if node == "verifier":
        if result.get("verifier_notes"):
            return t("done.verifier.recheck", lang)
        return t("done.verifier", lang, n=len(result.get("claims", [])))
    return ""


def _answer_payload(final: dict) -> dict:
    return {
        "text": final["text"], "claims": final["claims"], "conflicts": final["conflicts"],
        "sources": final["sources"], "disclaimer": final["disclaimer"], "revisions": final["revisions"],
    }


async def _run(question: str, ip: str, token: str, lang: Lang = "en") -> AsyncIterator[dict]:
    if not question:
        yield _error("invalid_input", t("error.empty", lang))
        return
    if len(question) > MAX_QUESTION_CHARS:
        yield _error("invalid_input", t("error.too_long", lang, n=MAX_QUESTION_CHARS))
        return
    if not await turnstile.verify(token, ip):
        yield _error("invalid_input", t("error.bot", lang))
        return

    if cached := await limits.cached_answer(question, lang):
        yield _event("answer", {**cached, "cached": True})
        yield _event("quota", {"remainingToday": await limits.remaining_today()})
        return

    if not await limits.allow_ip(ip):
        yield _error("rate_limited", t("error.rate_limited", lang))
        return
    remaining = await limits.reserve_answer()
    if remaining is None:
        yield _error("quota_exhausted", t("error.quota_exhausted", lang))
        yield _event("quota", {"remainingToday": 0, "resetsAt": limits.resets_at()})
        return

    usage = UsageMetadataCallbackHandler()
    started = time.monotonic()
    final = None
    current = "orchestrator"
    try:
        config = {"callbacks": [usage], "run_name": "ask", "metadata": {"surface": "api"}}
        async for mode, chunk in graph.astream({"question": question, "lang": lang}, config, stream_mode=["tasks", "custom"]):
            if mode == "custom" and chunk.get("type") == "waiting":
                yield _event("step", {"agent": current, "status": "waiting",
                                      "summary": t("waiting", lang, n=chunk["seconds"])})
                continue
            if mode != "tasks" or chunk["name"] not in (*STEPS, "finalize", "localize"):
                continue
            node = chunk["name"]
            if "result" not in chunk:  # task started
                current = node
                if node in STEPS:
                    yield _event("step", {"agent": node, "status": "started", "summary": t(f"step.{node}", lang)})
                continue
            result = chunk["result"] or {}
            if node in ("finalize", "localize"):
                final = result.get("final_answer", final)  # localize returns nothing when there is nothing to translate
                continue
            yield _event("step", {"agent": node, "status": "finished", "summary": _finished_summary(node, result, lang)})
            if node == "verifier":
                for claim in result.get("claims", []):
                    yield _event("claim", claim)
    except AppError as exc:
        await limits.refund_answer()
        yield _error(exc.code, t(f"error.{exc.code}", lang))
        return
    except Exception as exc:  # noqa: BLE001 — never leak internals to the client
        await limits.refund_answer()
        log.exception("run failed: %s", type(exc).__name__)
        yield _error("internal", t("error.internal", lang))
        return
    finally:
        await asyncio.to_thread(wait_for_all_tracers)  # serverless: flush traces before returning

    tokens = sum(u.get("total_tokens", 0) for u in usage.usage_metadata.values())
    log.info("answer done tokens=%d revisions=%d seconds=%.1f",
             tokens, final["revisions"], time.monotonic() - started)
    payload = _answer_payload(final)
    await limits.cache_answer(question, lang, payload)
    yield _event("answer", payload)
    yield _event("quota", {"remainingToday": remaining})


@app.post("/api/ask")
async def ask(body: AskBody, request: Request) -> EventSourceResponse:
    return EventSourceResponse(_run(body.question.strip(), _client_ip(request), body.turnstileToken, body.lang))


@app.get("/api/quota")
async def quota() -> dict:
    return {"remainingToday": await limits.remaining_today(), "resetsAt": limits.resets_at()}


@app.get("/api/health")
async def health() -> dict:
    return {"ok": True, "disclaimer": t("disclaimer")}
