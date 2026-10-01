"""Model factory. Agents ask for a model by role; the provider lives only here."""

import os
from typing import Literal

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq

from app.config import settings

Role = Literal["orchestrator", "policy", "employer", "synthesizer", "verifier"]

_ENV_BY_ROLE: dict[Role, str] = {
    "orchestrator": "MODEL_ORCHESTRATOR",
    "policy": "MODEL_POLICY",
    "employer": "MODEL_EMPLOYER",
    "synthesizer": "MODEL_SYNTHESIZER",
    "verifier": "MODEL_VERIFIER",
}


def get_model(role: Role, *, temperature: float = 0.0, max_tokens: int = 2048) -> BaseChatModel:
    env_var = _ENV_BY_ROLE[role]
    model = os.getenv(env_var)
    if not model:
        raise RuntimeError(f"{env_var} is not set")
    return ChatGroq(
        model=model,
        temperature=temperature,
        # Explicit cap: without it Groq may reserve the model's full output size
        # and reject the request against the free tier's per-minute output limit.
        max_tokens=max_tokens,
        # gpt-oss spends most output on reasoning by default; "low" keeps one answer inside
        # the free tier's 8K tokens/minute. Qwen returns no reasoning tokens by default.
        reasoning_effort=os.getenv("REASONING_EFFORT", "low") if model.startswith("openai/gpt-oss") else None,
        timeout=settings.http_timeout_s * 2,  # generation can outlast a plain HTTP call
        max_retries=0,  # 429 handling is ours (CLAUDE.md §7), not the SDK's
    )
