"""LangGraph nodes: orchestrator, policy_agent, synthesizer, verifier, finalize."""

import asyncio
import json
import re
from typing import Literal

import groq
from langchain_core.exceptions import OutputParserException
from pydantic import BaseModel, Field, ValidationError

from app import prompts
from app.errors import AppError, QuotaExhausted, UpstreamBusy
from app.graph import kb
from app.graph.state import AgentState, Claim, Conflict, DraftUnit
from app.llm import Role, get_model

MAX_REVISIONS = 2
DISCLAIMER = (
    "This is information from official sources, not legal advice. For your specific "
    "case, talk to a licensed immigration consultant (RCIC) or lawyer."
)


_MAX_BACKOFF_S = 20.0  # fits easily inside Vercel's 300 s; the UI shows the wait


def _is_daily_limit(err: groq.RateLimitError) -> bool:
    msg = str(err).lower()
    return "per day" in msg or "(tpd)" in msg or "(rpd)" in msg


def _retry_after_s(err: groq.RateLimitError) -> float:
    """Groq's TPM window is rolling: waiting exactly as long as it says often isn't enough."""
    header = float(err.response.headers.get("retry-after") or 0)
    m = re.search(r"try again in ([\d.]+)(ms|s)", str(err))
    message = (float(m[1]) / (1000 if m[2] == "ms" else 1)) if m else 0
    return max(header, message, 1.0) + 1.5


async def _invoke(role: Role, schema: type[BaseModel], messages: list, temperature: float = 0.0):
    """Groq 429s (CLAUDE.md §7): wait out a per-minute limit once, then give up as upstream_busy."""
    model = get_model(role, temperature=temperature).with_structured_output(schema, method="json_schema")
    try:
        return await model.ainvoke(messages)
    except groq.RateLimitError as err:
        if _is_daily_limit(err):
            raise QuotaExhausted from err
        wait = _retry_after_s(err)
        if wait > _MAX_BACKOFF_S:
            raise UpstreamBusy from err
        await asyncio.sleep(wait)
    try:
        return await model.ainvoke(messages)
    except groq.RateLimitError as err:
        raise (QuotaExhausted if _is_daily_limit(err) else UpstreamBusy) from err


async def _structured[T: BaseModel](role: Role, prompt: str, schema: type[T], payload: dict) -> T:
    """System prompt stays fixed (prompt caching); everything per-request goes in the user turn."""
    messages = [("system", prompts.load(prompt)), ("user", json.dumps(payload, ensure_ascii=False, indent=1))]
    try:
        return await _invoke(role, schema, messages)
    except (groq.BadRequestError, ValidationError, OutputParserException):
        # One retry on malformed output; at temperature 0 the same request would fail the same way.
        return await _invoke(role, schema, messages, temperature=0.4)


# --- orchestrator -------------------------------------------------------------

class Profile(BaseModel):
    occupation: str | None = None
    noc_code: str | None = None
    province: str | None = None
    city: str | None = None
    education: str | None = None
    job_offer: str | None = None
    current_status: str | None = None


class OrchestratorOut(BaseModel):
    profile: Profile
    premises: list[str] = Field(default_factory=list)
    in_scope: bool
    needs_employer_data: bool = False
    plan: list[str] = Field(default_factory=list)


async def orchestrator(state: AgentState) -> dict:
    out = await _structured("orchestrator", "orchestrator", OrchestratorOut, {"question": state["question"]})
    premises = [
        Claim(id=f"p{i}", text=t, source_id="", source_url=None, source_date=None,
              status="unverified", note=None)
        for i, t in enumerate(out.premises, 1)
    ]
    plan = list(out.plan)
    if out.needs_employer_data:
        plan.append("Employer lookup requested, but employer data is not available yet.")  # Phase E
    return {"profile": out.profile.model_dump(exclude_none=True), "premises": premises,
            "in_scope": out.in_scope, "plan": plan, "revision_count": 0}


# --- policy agent ---------------------------------------------------------------

class SelectOut(BaseModel):
    knowledge_base: str
    paths: list[str] = Field(max_length=3)
    archived_paths: list[str] = Field(max_length=2)  # required: forces an explicit "any older snapshots?"


class Finding(BaseModel):
    text: str
    source_path: str
    source_url: str | None = None
    source_date: str | None = None
    archived: bool = False


class ExtractOut(BaseModel):
    findings: list[Finding] = Field(default_factory=list)


async def policy_agent(state: AgentState) -> dict:
    outline = await kb.outline()
    sources = dict(state.get("sources", {}))
    context = {
        "question": state["question"], "profile": state.get("profile", {}),
        "premises": [p["text"] for p in state.get("premises", [])], "plan": state.get("plan", []),
        "verifier_notes": state.get("verifier_notes", []), "already_read": list(sources),
    }

    pick = await _structured("policy", "policy_select", SelectOut, {"outline": outline, **context})
    known_kbs = kb.kb_ids(outline)
    kb_id = pick.knowledge_base if pick.knowledge_base in known_kbs else (known_kbs or [""])[0]
    # Only paths that literally appear in the outline: the model may not invent entries.
    paths = list(dict.fromkeys(p for p in [*pick.paths, *pick.archived_paths] if p in outline and p not in sources))[:4]
    if paths:
        sources |= await kb.read(kb_id, paths)
    new_entries = {p: sources[p] for p in paths if p in sources}
    if not new_entries:
        return {"sources": sources}

    out = await _structured("policy", "policy_extract", ExtractOut, {"entries": new_entries, **context})
    findings = list(state.get("policy_findings", []))
    for f in out.findings:
        entry = sources.get(f.source_path)
        # Provenance guard: the URL must be in the cited entry, or the finding is dropped.
        if entry is None or not f.source_url or f.source_url not in entry:
            continue
        date = f.source_date if f.source_date and f.source_date in entry else None
        findings.append(Claim(
            id=f"c{len(findings) + 1}", text=f.text, source_id=f.source_path, source_url=f.source_url,
            source_date=date, status="unverified", note="archived source" if f.archived else None,
        ))
    return {"sources": sources, "policy_findings": findings}


# --- synthesizer --------------------------------------------------------------

class Unit(BaseModel):
    kind: Literal["fact", "not_covered"]
    text: str
    claim_ids: list[str]


class SynthOut(BaseModel):
    units: list[Unit]


def _usable_findings(state: AgentState) -> list[Claim]:
    rejected = set(state.get("rejected_claim_ids", []))
    return [c for c in state.get("policy_findings", []) if c["id"] not in rejected]


async def synthesizer(state: AgentState) -> dict:
    findings = _usable_findings(state)
    payload = {
        "question": state["question"], "profile": state.get("profile", {}),
        "findings": [{"id": c["id"], "text": c["text"],
                      **({"archived": True} if c["note"] == "archived source" else {})} for c in findings],
    }
    valid = {c["id"] for c in findings}
    for _ in range(2):
        out = await _structured("synthesizer", "synthesizer", SynthOut, payload)
        draft = [
            DraftUnit(text=u.text, claim_ids=[i for i in u.claim_ids if i in valid])
            for u in out.units
            # A statement of fact with no finding behind it is never shipped.
            if u.kind == "not_covered" or any(i in valid for i in u.claim_ids)
        ]
        # A draft that cites none of the findings would ship facts nobody verified.
        if not findings or any(u["claim_ids"] for u in draft):
            return {"draft": draft}
    raise AppError("synthesizer produced an answer without citations")


# --- verifier -----------------------------------------------------------------

class FindingVerdict(BaseModel):
    id: str
    status: Literal["supported", "unsupported", "outdated", "conflict"]
    note: str
    replaced_by: list[str]      # ids of findings that state the current rule


class PremiseVerdict(BaseModel):
    id: str
    status: Literal["supported", "contradicted", "not_covered"]
    note: str
    contradicted_by: list[str]  # ids of current findings that say otherwise
    matches_older: list[str]    # ids of archived findings that state the same older rule


class VerifyOut(BaseModel):
    findings: list[FindingVerdict]
    premises: list[PremiseVerdict]


def _needs_revision(claims: list[Claim], revision_count: int) -> bool:
    return revision_count < MAX_REVISIONS and any(
        c["id"].startswith("c") and c["status"] in ("unsupported", "outdated") for c in claims
    )


async def verifier(state: AgentState) -> dict:
    by_id = {c["id"]: c for c in state.get("policy_findings", [])}
    used_ids = list(dict.fromkeys(i for u in state.get("draft", []) for i in u["claim_ids"]))
    used = [by_id[i] for i in used_ids]
    premises = state.get("premises", [])
    if not used and not premises:
        return {"claims": [], "verifier_notes": []}

    cited = {c["source_id"] for c in used}
    sources = state.get("sources", {})
    if missing := [p for p in cited if p not in sources]:  # re-read via MCP when needed
        known = kb.kb_ids(await kb.outline())
        sources = sources | await kb.read(known[0], missing)

    out = await _structured("verifier", "verifier", VerifyOut, {
        "sources": sources,
        "findings": [{"id": c["id"], "text": c["text"], "source_path": c["source_id"],
                      **({"archived": True} if c["note"] == "archived source" else {})} for c in used],
        # Findings not in the draft, so an outdated claim can point at its current replacement.
        "other_findings": [{"id": c["id"], "text": c["text"]} for c in by_id.values() if c["id"] not in used_ids],
        "premises": [{"id": p["id"], "text": p["text"]} for p in premises],
    })

    checked: list[Claim] = []
    conflicts: list[Conflict] = []
    first = lambda ids: next((by_id[i] for i in ids if i in by_id), None)

    premise_verdicts = {v.id: v for v in out.premises}
    for premise in premises:
        v = premise_verdicts.get(premise["id"])
        if v is None:
            checked.append(Claim(**{**premise, "status": "unsupported", "note": "Could not be checked."}))
            continue
        older = first(v.matches_older)
        status = {"supported": "supported", "not_covered": "unsupported",
                  "contradicted": "outdated" if older else "unsupported"}[v.status]
        checked.append(c := Claim(**{**premise, "status": status, "note": v.note}))
        current = first(v.contradicted_by)
        if v.status == "contradicted" and current:
            # Show the archived source that said the same thing, else "what you read".
            old = Claim(**{**older, "status": "outdated", "note": v.note}) if older else c
            conflicts.append(Conflict(old=old, current=current))

    finding_verdicts = {v.id: v for v in out.findings}
    for claim in used:
        v = finding_verdicts.get(claim["id"])
        status, note = (v.status, v.note) if v else ("unsupported", "The verifier could not confirm this.")
        checked.append(c := Claim(**{**claim, "status": status, "note": note}))
        if status in ("outdated", "conflict"):
            conflicts.append(Conflict(old=c, current=first(v.replaced_by)))

    revision_count = state.get("revision_count", 0)
    if not _needs_revision(checked, revision_count):
        return {"claims": checked, "conflicts": conflicts, "verifier_notes": []}
    bad = [c for c in checked if c["id"].startswith("c") and c["status"] in ("unsupported", "outdated")]
    return {
        "claims": checked, "conflicts": conflicts, "revision_count": revision_count + 1,
        "rejected_claim_ids": [*state.get("rejected_claim_ids", []), *(c["id"] for c in bad)],
        "verifier_notes": [f'{c["status"].upper()}: "{c["text"]}" ({c["note"]})' for c in bad],
    }


def route_after_verifier(state: AgentState) -> Literal["policy_agent", "finalize"]:
    return "policy_agent" if state.get("verifier_notes") else "finalize"


def route_after_orchestrator(state: AgentState) -> Literal["policy_agent", "finalize"]:
    return "policy_agent" if state.get("in_scope", True) else "finalize"


# --- finalize -----------------------------------------------------------------

NOT_COVERED = (
    "I can't answer this from the sources I use. They cover Canadian work permits and "
    "permanent residence pathways for tech workers, mainly in Ontario."
)


def finalize(state: AgentState) -> dict:
    claims = state.get("claims", [])
    status = {c["id"]: c["status"] for c in claims}
    keep = {i for i, s in status.items() if s in ("supported", "conflict")}
    by_id = {c["id"]: c for c in state.get("policy_findings", [])}

    numbers: dict[str, int] = {}  # source URL -> citation number
    sources: list[dict] = []
    lines: list[str] = []
    for unit in state.get("draft", []):
        ids = [i for i in unit["claim_ids"] if i in keep]
        if unit["claim_ids"] and not ids:
            continue  # every fact in this unit was rejected
        marks = []
        for i in ids:
            url = by_id[i]["source_url"]
            if url not in numbers:
                numbers[url] = len(numbers) + 1
                sources.append({"n": numbers[url], "url": url, "date": by_id[i]["source_date"],
                                "entry": by_id[i]["source_id"]})
            marks.append(f"[{numbers[url]}]")
        lines.append(unit["text"] + (" " + "".join(dict.fromkeys(marks)) if marks else ""))

    if not lines:
        lines = [NOT_COVERED]

    # One callout per old statement; the latest verdict wins.
    conflicts = list({c["old"]["text"]: c for c in state.get("conflicts", [])}.values())
    return {"final_answer": {
        "text": "\n\n".join(lines), "sources": sources,
        "claims": [c for c in claims if c["status"] != "unsupported" or c["id"].startswith("p")],
        "conflicts": conflicts, "disclaimer": DISCLAIMER,
        "revisions": state.get("revision_count", 0),
    }}
