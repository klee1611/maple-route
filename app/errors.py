"""Errors that map to the API's `error` event codes (CLAUDE.md §6)."""


class AppError(Exception):
    code = "internal"
    message = "Something went wrong on our side. Please try again."


class UpstreamBusy(AppError):
    code = "upstream_busy"
    message = "The AI service is busy right now. Please try again in a minute."


class QuotaExhausted(AppError):
    code = "quota_exhausted"
    message = "The free daily limit has been reached."
