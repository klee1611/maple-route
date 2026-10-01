"""Graph wiring tests with the LLM and Knowledge Base faked out (no network)."""

import pytest

from app.graph import nodes
from app.graph.build import build_graph

OUTLINE = "Knowledge base id: `kbTEST`\n\nwp/current [core]\n\nwp/archive\n"
ENTRIES = {
    "wp/current": "Programs must be on the list [1].\n\n## Sources\n\n"
                  "1. Rules | x.invalid § Rules › Updated: September 20, 2026 — Web · https://x.invalid/now\n",
    "wp/archive": "Any program qualifies [1].\n\n## Sources\n\n"
                  "1. Old rules | x.invalid § Old rules › Captured: June 1, 2023 — Web\n",
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
                          change_paths=[])
        if prompt == "policy_extract":
            [(path, text)] = payload["entries"].items()
            return schema(findings=[
                {"text": text.split(" [")[0], "source_path": path, "source_refs": [1], "former_rule": False},
                {"text": "Invented", "source_path": path, "source_refs": [9], "former_rule": False},  # no [9]
            ])
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
    assert "Invented" not in answer["text"]  # cited a source number the entry doesn't have
    assert [(s["url"], s["date"]) for s in answer["sources"]] == [("https://x.invalid/now", "September 20, 2026")]
    old = answer["conflicts"][0]["old"]
    assert (old["source_title"], old["source_url"], old["source_date"]) == (
        "Old rules | x.invalid § Old rules › Captured: June 1, 2023", None, "June 1, 2023")


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
    finding = lambda i, title: {"id": i, "text": i, "source_id": "e", "source_title": title, "source_url": None,
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
    assert [s["title"] for s in answer["sources"]] == ["u1"]


def test_out_of_scope_skips_research():
    answer = nodes.finalize({"in_scope": False})["final_answer"]
    assert answer["text"] == nodes.NOT_COVERED


def test_citations_parse_real_format_and_trim_keeps_sources():
    from app.graph import kb

    entry = ("x" * 9000 + "\n\n## Sources\n\n"
             "1. Page A | ontario.ca § Updates › April 23, 2026 › Draw — Web\n"
             "2. Page B - Canada.ca — Web · https://www.canada.ca/b.html\n")
    assert kb.citations(entry) == {
        1: {"title": "Page A | ontario.ca § Updates › April 23, 2026 › Draw", "url": None, "date": "April 23, 2026"},
        2: {"title": "Page B - Canada.ca", "url": "https://www.canada.ca/b.html", "date": None},
    }
    trimmed = kb.trim(entry)
    assert len(trimmed) <= kb.MAX_ENTRY_CHARS + 50
    assert kb.citations(trimmed) == kb.citations(entry)
