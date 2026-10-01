"""Graph wiring tests with the LLM and Knowledge Base faked out (no network)."""

import pytest

from app.graph import nodes
from app.graph.build import build_graph

OUTLINE = "kbTEST\n- wp/current [core] — current rule\n- wp/archive [peripheral] — 2023 snapshot"
ENTRIES = {
    "wp/current": "Programs must be on the list. Source: https://x.invalid/now (2026-09-20)",
    "wp/archive": "Any program qualifies. Source: https://x.invalid/old (2023-06-01)",
}


@pytest.fixture
def fake_world(monkeypatch):
    """Policy agent reads the archive first, then the current entry on revision."""
    calls = {"verifier": 0, "synth_findings": []}

    async def outline():
        return OUTLINE

    async def read(_kb, paths):
        return {p: ENTRIES[p] for p in paths}

    async def structured(role, prompt, schema, payload):
        if prompt == "orchestrator":
            return schema(profile={}, premises=[], in_scope=True, plan=[])
        if prompt == "policy_select":
            first = not payload["already_read"]
            return schema(knowledge_base="kbTEST", paths=["wp/archive" if first else "wp/current"],
                          archived_paths=[])
        if prompt == "policy_extract":
            [(path, text)] = payload["entries"].items()
            url = text.split("Source: ")[1].split()[0]
            return schema(findings=[{"text": text.split(".")[0], "source_path": path, "source_url": url}])
        if prompt == "synthesizer":
            calls["synth_findings"].append([f["id"] for f in payload["findings"]])
            return schema(units=[{"kind": "fact", "text": f["text"], "claim_ids": [f["id"]]}
                                for f in payload["findings"]])
        if prompt == "verifier":
            calls["verifier"] += 1
            return schema(premises=[], findings=[
                {"id": f["id"], "note": "n", "replaced_by": [],
                 "status": "outdated" if f["text"].startswith("Any program") else "supported"}
                for f in payload["findings"]
            ])
        raise AssertionError(prompt)

    monkeypatch.setattr(nodes.kb, "outline", outline)
    monkeypatch.setattr(nodes.kb, "read", read)
    monkeypatch.setattr(nodes, "_structured", structured)
    return calls


async def test_verifier_rejects_outdated_claim_and_answer_is_corrected(fake_world):
    state = await build_graph().ainvoke({"question": "q"})
    answer = state["final_answer"]

    assert answer["revisions"] == 1
    assert fake_world["synth_findings"] == [["c1"], ["c2"]]  # rejected c1 not reused
    assert "Programs must be on the list" in answer["text"]
    assert "Any program qualifies" not in answer["text"]
    assert [s["url"] for s in answer["sources"]] == ["https://x.invalid/now"]
    assert answer["conflicts"][0]["old"]["source_url"] == "https://x.invalid/old"


async def test_revisions_stop_at_two(fake_world, monkeypatch):
    async def always_archive(_kb, paths):
        return {p: ENTRIES["wp/archive"] for p in paths}

    monkeypatch.setattr(nodes.kb, "read", always_archive)
    state = await build_graph().ainvoke({"question": "q"})
    answer = state["final_answer"]
    assert answer["revisions"] == nodes.MAX_REVISIONS
    assert fake_world["verifier"] == nodes.MAX_REVISIONS  # third pass has nothing left to check
    assert answer["text"] == nodes.NOT_COVERED


def test_finalize_drops_unsupported_and_numbers_sources_by_url():
    finding = lambda i, url: {"id": i, "text": i, "source_id": "e", "source_url": url,
                              "source_date": None, "status": "unverified", "note": None}
    state = {
        "policy_findings": [finding("c1", "u1"), finding("c2", "u1"), finding("c3", "u2")],
        "claims": [{**finding("c1", "u1"), "status": "supported"},
                   {**finding("c2", "u1"), "status": "supported"},
                   {**finding("c3", "u2"), "status": "unsupported"}],
        "draft": [{"text": "A", "claim_ids": ["c1", "c2"]},
                  {"text": "B", "claim_ids": ["c3"]},
                  {"text": "Not covered.", "claim_ids": []}],
    }
    answer = nodes.finalize(state)["final_answer"]
    assert answer["text"] == "A [1]\n\nNot covered."
    assert [s["url"] for s in answer["sources"]] == ["u1"]


def test_out_of_scope_skips_research():
    answer = nodes.finalize({"in_scope": False})["final_answer"]
    assert answer["text"] == nodes.NOT_COVERED
