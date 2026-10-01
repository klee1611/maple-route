"""API contract tests (CLAUDE.md §6-7) with the graph faked out."""

import dataclasses
import json

import httpx
import pytest

from app import limits, main
from app.errors import UpstreamBusy

FINAL = {"text": "Answer [1]", "claims": [], "conflicts": [], "sources": [], "disclaimer": "d", "revisions": 0}


class FakeGraph:
    def __init__(self, fail: Exception | None = None):
        self.fail, self.calls = fail, 0

    async def astream(self, *_args, **_kwargs):
        self.calls += 1
        yield "tasks", {"name": "orchestrator"}
        if self.fail:
            raise self.fail
        yield "custom", {"type": "waiting", "seconds": 7}
        yield "tasks", {"name": "orchestrator", "result": {"premises": []}, "error": None}
        yield "tasks", {"name": "finalize", "result": {"final_answer": FINAL}, "error": None}


@pytest.fixture
def api(monkeypatch):
    monkeypatch.setattr(limits, "store", limits.MemoryStore())
    small = dataclasses.replace(limits.settings, daily_answer_limit=2, per_ip_hourly_limit=2)
    monkeypatch.setattr(limits, "settings", small)
    monkeypatch.delenv("TURNSTILE_SECRET_KEY", raising=False)
    monkeypatch.delenv("VERCEL", raising=False)
    graph = FakeGraph()
    monkeypatch.setattr(main, "graph", graph)
    return graph


async def ask(question: str, ip: str = "1.2.3.4") -> list[tuple[str, dict]]:
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://t") as client:
        resp = await client.post("/api/ask", json={"question": question}, headers={"x-forwarded-for": ip})
    events, name = [], None
    for line in resp.text.splitlines():
        if line.startswith("event: "):
            name = line[7:].strip()
        elif line.startswith("data: "):
            events.append((name, json.loads(line[6:])))
    return events


async def test_streams_steps_answer_and_quota(api):
    events = await ask("q1")
    assert [e for e, _ in events] == ["step", "step", "step", "answer", "quota"]
    assert events[1][1]["status"] == "waiting"
    assert events[-1][1] == {"remainingToday": 1}


async def test_cache_hit_skips_llm_and_budget(api):
    await ask("Same   Question")
    events = await ask("  same question ")
    assert api.calls == 1
    assert events[0][1]["cached"] is True
    assert events[-1][1] == {"remainingToday": 1}


async def test_daily_budget_exhausted_without_calling_llm(api):
    await ask("a", ip="1.1.1.1")
    await ask("b", ip="2.2.2.2")
    events = await ask("c", ip="3.3.3.3")
    assert events[0] == ("error", {"code": "quota_exhausted", "message": "The free daily limit has been reached."})
    assert api.calls == 2


async def test_per_ip_hourly_limit(api):
    await ask("a")
    await ask("b")
    events = await ask("c")
    assert events[0][1]["code"] == "rate_limited"


async def test_failed_run_refunds_budget_and_hides_internals(api, monkeypatch):
    monkeypatch.setattr(main, "graph", FakeGraph(fail=RuntimeError("secret stack detail")))
    events = await ask("boom")
    assert events[-1][1]["code"] == "internal"
    assert "secret" not in json.dumps(events)
    assert await limits.remaining_today() == 2


async def test_upstream_busy_maps_to_error_code(api, monkeypatch):
    monkeypatch.setattr(main, "graph", FakeGraph(fail=UpstreamBusy()))
    events = await ask("busy")
    assert events[-1][1]["code"] == "upstream_busy"


async def test_invalid_input(api):
    assert (await ask("   "))[0][1]["code"] == "invalid_input"
    assert (await ask("x" * 1001))[0][1]["code"] == "invalid_input"
    assert api.calls == 0


async def test_turnstile_rejection(api, monkeypatch):
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "2x0000000000000000000000000000000AA")  # Cloudflare: always fails
    events = await ask("q")
    assert events[0][1]["code"] == "invalid_input"
    assert api.calls == 0
