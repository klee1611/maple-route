"""Shared LangGraph state (CLAUDE.md §5, plus the D4 premise fields)."""

import operator
from typing import Annotated, Literal, TypedDict

ClaimStatus = Literal["unverified", "supported", "unsupported", "outdated", "conflict"]


class Claim(TypedDict):
    id: str                 # "c1", "c2"... for findings; "p1"... for user premises
    text: str
    source_id: str          # KB entry path ("" for a premise the user stated)
    source_url: str | None
    source_date: str | None
    status: ClaimStatus
    note: str | None        # verifier explanation


class Conflict(TypedDict):
    """One "Changed" callout: what an older source (or the user) said vs. the current rule."""

    old: Claim
    current: Claim | None


class DraftUnit(TypedDict):
    """A paragraph or bullet of the answer and the findings it relies on."""

    text: str
    claim_ids: list[str]


class AgentState(TypedDict, total=False):
    question: str
    profile: dict
    premises: list[Claim]
    in_scope: bool
    plan: list[str]
    sources: dict[str, str]             # entry path -> entry text read this run
    policy_findings: list[Claim]
    rejected_claim_ids: list[str]       # outdated/unsupported findings the synthesizer must not reuse
    employer_findings: list[dict]       # Phase E
    draft: list[DraftUnit]
    claims: list[Claim]                 # verified premises + draft claims (latest pass)
    conflicts: Annotated[list[Conflict], operator.add]
    verifier_notes: list[str]
    revision_count: int
    final_answer: dict
