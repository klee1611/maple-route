# Maple Route — Design (v1)

Agreed 2026-10-01 during brainstorming. CLAUDE.md remains the spec; this file
records where v1 narrows or adjusts it, and why.

## Understanding summary

- **What:** LangGraph multi-agent system (orchestrator, policy agent,
  synthesizer, verifier) answering Canadian work-permit / PR questions for
  Ontario tech workers, using only a Sanity Knowledge Base via Context MCP,
  with a citation on every claim.
- **Signature feature:** a "Changed" callout when the user's premise or a
  draft claim relies on a rule that is no longer current.
- **Why:** DEV.to Sanity Challenge, Path One (judged on Sanity Context,
  Knowledge Base use, structured content, usability). Stays public afterwards.
- **Who:** anxious tech workers, often non-native English speakers, checking
  whether what they read online is still true.
- **Constraints:** deadline 2026-10-04 23:59 PDT (~3.5 days from start), no
  Sanity setup at start, free tiers only (Groq, Vercel Hobby, Upstash, KB ~150
  docs).
- **Non-goals (v1):** employer/LMIA lookup (Phase E), legal advice, provinces
  other than Ontario, conversation history, answers from model knowledge or web.

## Assumptions

| # | Assumption |
|---|---|
| A1 | Full run (incl. up to 2 revisions) < 60 s typical; ≤ 6 tool calls per agent; 15 s timeout per external call. Vercel Hobby `maxDuration` is 300 s. |
| A2 | Demo-scale traffic: 30 answers/day, 5/hour/IP. |
| A3 | Questions are never stored by us. Cache key = hash, value = final answer. LangSmith traces do contain questions (disclosed on `/privacy`). |
| A4 | Best-effort availability; friendly errors; cache absorbs repeated demo questions. |
| A5 | Single owner; prompts in files; models via env vars; runs unattended on free tiers. |
| A6 | The Day-1 conflict spike decides whether `ruleChange` docs are added (D2). |
| A7 | State gains `premises: list[Claim]` (D4). |

## Decision log

| # | Decision | Alternatives | Why |
|---|---|---|---|
| D1 | Employer agent, LMIA import, and Employer endpoint deferred to **Phase E** (after core ships). Graph keeps a slot for it. | Build now; cut only if behind | Time; judging centers on the KB; most self-contained chunk. |
| D2 | **Conflict spike on Day 1**: tiny KB with an archived + current PGWP page, read via MCP. If conflicts appear in entry text, use them; else add structured `ruleChange` docs (dataset source feeding the KB). | Commit to `ruleChange` now; rely on KB conflicts only | Docs: KB detects conflicts at **build time** as issues for human resolution; no MCP tool exposes issues. Demo must be reliable. |
| D3 | **User does the Sanity setup**; agents are built against a **mock MCP server** with the documented tool contract, then pointed at the real endpoint. | Guided clicking; scripting | Removes setup from the critical path. |
| D4 | Verifier checks **premises + draft claims**. Orchestrator extracts rules the user states as fact. | Draft only; seeded archived entries | Reliable, honest demo; matches product purpose. |
| D5 | Python via **pyenv 3.13.12 + uv** (`pyproject.toml`, `uv.lock`), not `requirements.txt`. | requirements.txt | User's tooling; Vercel supports pyproject + uv.lock and Python 3.13. |
| D6 | **SSE streaming** on Vercel (no polling fallback). | Polling | Vercel docs: Python functions stream by default; Hobby max 300 s. |
| D7 | Retrieved KB context per LLM call kept ≤ ~4–5K tokens; read 1–3 entries per call. | Read freely | Groq free tier: 8K TPM per model, and a single request over the TPM limit fails. |
| D8 | Policy agent is a fixed pipeline (select ≤3 entries + ≤2 archived → read → extract), not a free ReAct loop. A finding's URL must appear in its entry or it is dropped. | ReAct tool loop (Phase 2 baseline) | Predictable token use; blocks invented URLs whatever the real citation format is. The baseline produced broken `【2†L1】` citations and uncited steps. |
| D9 | Structured output via Groq `json_schema`; fields the model tends to skip are **required** (`archived_paths`, `contradicted_by`, `matches_older`, unit `kind`). Code, not the model, decides callouts and drops uncited `fact` units. | Optional fields + prompt instructions | Optional fields were left empty at low reasoning effort (callout 0/3); required fields → 3/3. |
| D10 | Models: orchestrator `qwen/qwen3.8-27b`; policy + synthesizer `gpt-oss-120b`; verifier `gpt-oss-20b`; `reasoning_effort=low` for gpt-oss. | qwen for verifier/synthesizer | qwen produced malformed JSON (verifier) and dropped citation ids (synthesizer). Low effort cut output tokens ~60%. |
| D11 | 429: wait max(header, message) + 1.5 s once (≤ 20 s), then `upstream_busy`; daily limits → `quota_exhausted`. | Exact retry-after | Groq's TPM window is rolling; exact waits failed. |
| D12 | One MCP session per batch of KB calls, calls in sequence. | One session per tool call, parallel | Parallel session setup timed out; fewer handshakes. |
| D13 | **D2 outcome:** the real KB generates its own change history. Given the Purpose text, the build produced a `policy_timeline` entry with "What is now outdated" / "What is currently active" sections and effective dates. The policy agent reads it via `change_paths`, and findings are flagged `former_rule`. No `ruleChange` docs needed for now. | `ruleChange` dataset docs | KB-native, which is what the judges score. |
| D14 | Real citation format is `N. <page> \| <site> § <section path> — Web [· <url>]`, and **most citations have no URL**. Findings cite by reference number; code resolves title/URL/date from the entry's Sources list (the provenance guard). Trimming never cuts the Sources list. | Model copies URLs | Model-copied URLs can't be checked, and most entries have none. |
| D15 | Strict structured outputs (`strict=True`, gpt-oss only); entry selection moved to qwen; synthesizer + verifier on `gpt-oss-20b`; verifier sees only the entries the draft cites. | | Measured on the real KB: 120b 4.2K, 20b 6.0K, qwen 1.3K tokens per answer. |

**Measured capacity (mock KB):** ~6–7K tokens per answer on `gpt-oss-120b`, 6–20 s per answer. The free tier therefore sustains roughly **one uncached answer per minute** for the whole app; cache hits are free. Real KB entries may be longer — re-measure after the switch.

## Verified platform facts (from docs, 2026-10-01)

- **Context MCP, KB mode tools:** `initial_context()` → outline per KB (entries
  tagged `[core]` / standard / `[peripheral]`); `knowledge_base_read(knowledgeBase, paths[1..20])`
  → full entry Markdown with citations back to sources. GROQ mode:
  `initial_context`, `schema_explorer`, `groq_query`, `array_field_reader`.
- **Endpoint:** `https://api.sanity.io/v1/context/organizations/:orgId/mcp/:name`,
  `Authorization: Bearer <org token with Context Viewer>`. Dataset source on an
  endpoint silently overrides KB sources. Transport not documented — `check_mcp.py`
  tries Streamable HTTP, then SSE.
- **Groq free tier** (per model): `openai/gpt-oss-120b`, `openai/gpt-oss-20b`,
  `qwen/qwen3.8-27b` — 30 RPM, 1K RPD, 8K TPM, 200K TPD. 429 carries
  `retry-after`.
- **Vercel Hobby:** 300 s default/max duration, 2 GB, 4.5 MB body,
  streaming enabled by default for Python.

## Architecture

```
START → orchestrator ─→ policy_agent ─→ synthesizer ─→ verifier ─┬→ finalize → END
                         ▲                                        │
                         └──── revise (outdated/unsupported, ≤2) ─┘
        (Phase E: orchestrator → employer_agent → synthesizer)
```

- **orchestrator** — extracts `profile` and `premises` (rules stated by the
  user), writes `plan`. No tools.
- **policy_agent** — Policy MCP only. Calls `initial_context` once (cached per
  process), picks ≤ 3 entries, reads them, emits `Claim`s with source id / URL /
  date. Receives verifier notes on revision.
- **synthesizer** — writes `draft` using only claim ids from findings; inline
  markers `[n]`. No tools.
- **verifier** — checks each premise and draft claim against the cited entry
  text (re-reads via MCP if not already in state). Statuses: `supported`,
  `unsupported`, `outdated`, `conflict`, plus a note and, for outdated/conflict,
  the current claim it should be replaced by.
- **finalize** — deterministic code: drop unsupported claims, build `conflicts`
  (old vs new, both citations), append disclaimer.

State = CLAUDE.md §5 `AgentState` + `premises: list[Claim]` +
`conflicts: list[dict]` + `verifier_notes: list[str]`.

## Build order (critical path)

1. Phase 0 scaffold + mock MCP server + `check_mcp.py` (works against mock and real).
2. Phase 2–4 graph against the mock; swap to real KB when ready.
3. Phase 5 API/limits/SSE.
4. Phase 6 frontend (design plan → approval → build).
5. Phase 7 deploy; Phase 8 eval + README; then Phase E if time remains.

## Open items

- Q3 resolved (D13, D14). Open: citations lack URLs (try a KB Instruction asking for page URLs); KB covers only OINP + Global Talent Stream so far.
