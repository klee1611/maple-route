"""Cloudflare Turnstile server-side validation (siteverify)."""

import logging
import os

import httpx

from app.config import settings

log = logging.getLogger(__name__)

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
MAX_TOKEN_LEN = 2048


async def verify(token: str, ip: str | None) -> bool:
    secret = os.getenv("TURNSTILE_SECRET_KEY")
    if not secret:
        if os.getenv("VERCEL"):
            log.error("TURNSTILE_SECRET_KEY is not set in a deployed environment")
            return False
        return True  # local development without Turnstile configured
    if not token or len(token) > MAX_TOKEN_LEN:
        return False
    data = {"secret": secret, "response": token, **({"remoteip": ip} if ip else {})}
    try:
        async with httpx.AsyncClient(timeout=settings.http_timeout_s) as client:
            resp = await client.post(SITEVERIFY_URL, data=data)
        return bool(resp.json().get("success"))
    except (httpx.HTTPError, ValueError) as exc:
        log.warning("turnstile verification failed: %s", type(exc).__name__)
        return False
