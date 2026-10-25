"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ask, getQuota, type Answer, type ErrorCode, type Quota } from "@/lib/api";
import type { Dictionary } from "@/lib/dictionaries/en";
import { fmt, type Locale } from "@/lib/i18n";
import { AnswerView } from "./AnswerView";
import { useI18n } from "./I18n";
import { Timeline, applyStep, emptyTimeline, type TimelineState } from "./Timeline";
import { Turnstile, type TurnstileHandle } from "./Turnstile";

const MAX_CHARS = 1000;

function formatReset(locale: Locale, tomorrow: string, resetsAt?: string): string {
  if (!resetsAt) return tomorrow;
  const d = new Date(resetsAt);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(d);
}

function errorText(dict: Dictionary, code: ErrorCode, message: string, resetTime: string): string {
  switch (code) {
    case "quota_exhausted":
      return fmt(dict.errors.quota_exhausted, { time: resetTime });
    // The server explains these in the page's language (it knows which check failed).
    case "rate_limited":
    case "invalid_input":
      return message || dict.errors[code];
    case "upstream_busy":
    case "network":
      return dict.errors[code];
    default:
      return dict.errors.internal;
  }
}

export function Checker() {
  const { locale, dict } = useI18n();
  const t = dict.home;
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [timeline, setTimeline] = useState<TimelineState>(emptyTimeline);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // A question submitted before Turnstile issued a token is sent as soon as one arrives.
  const [pending, setPending] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);
  const submitRef = useRef<(q: string, t: string) => void>(null);
  const turnstile = useRef<TurnstileHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getQuota().then(setQuota);
  }, []);

  const onToken = useCallback((t: string | null) => {
    setToken(t);
    const queued = pendingRef.current;
    if (t !== null && queued !== null) {
      pendingRef.current = null;
      submitRef.current?.(queued, t);
    }
  }, []);

  const exhausted = quota?.remainingToday === 0;
  const resetTime = formatReset(locale, t.tomorrow, quota?.resetsAt);
  const tooLong = question.length > MAX_CHARS;
  const canSubmit = !busy && !exhausted && !tooLong && question.trim().length > 0 && pending === null;

  async function submit(q: string, tok: string | null = token) {
    if (busy || exhausted) return;
    if (tok === null) {
      pendingRef.current = q;
      setPending(q);
      return;
    }
    setPending(null);
    setBusy(true);
    setAnswer(null);
    setError(null);
    setTimeline(emptyTimeline);
    resultRef.current?.focus();
    await ask(q.trim(), tok, locale, {
      onStep: (step) => setTimeline((prev) => applyStep(prev, step)),
      onClaim: () => {},
      onAnswer: setAnswer,
      onQuota: (next) => setQuota((prev) => ({ ...prev, ...next })),
      onError: (code, message) => setError(errorText(dict, code, message, resetTime)),
    });
    setBusy(false);
    turnstile.current?.reset(); // tokens are single-use
  }

  useEffect(() => {
    submitRef.current = submit;
  });

  const started = busy || answer || error || Object.keys(timeline.steps).length > 0;

  return (
    <div>
      <h1 className="max-w-[30ch] text-3xl leading-tight font-semibold sm:text-4xl">
        {t.heading}
      </h1>
      <p className="mt-3 max-w-[68ch] text-graphite">
        {t.intro}
      </p>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) submit(question);
        }}
      >
        <label htmlFor="question" className="block font-semibold">
          {t.label}
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          disabled={exhausted}
          aria-describedby="question-count quota-note"
          placeholder={t.placeholder}
          className="mt-2 block w-full resize-y rounded-sm border border-rule bg-field px-3 py-2.5 text-ink placeholder:text-graphite disabled:opacity-60"
        />
        <p
          id="question-count"
          className={`mt-1 text-right font-mono text-sm ${tooLong ? "text-editor" : "text-graphite"}`}
          aria-live={tooLong ? "polite" : "off"}
        >
          {question.length} / {MAX_CHARS}
          {tooLong && t.tooLong}
        </p>

        <div className="mt-2">
          <p className="text-base text-graphite" id="examples-label">
            {t.examplesLabel}
          </p>
          <ul aria-labelledby="examples-label" className="mt-2 flex flex-wrap gap-2">
            {t.examples.map((ex) => (
              <li key={ex.label}>
                <button
                  type="button"
                  disabled={busy || exhausted}
                  onClick={() => {
                    setQuestion(ex.question);
                    submit(ex.question);
                  }}
                  className="rounded-sm border border-rule px-3 py-1 text-base text-ink hover:border-ink disabled:opacity-50"
                >
                  {ex.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <Turnstile ref={turnstile} onToken={onToken} />
          {pending !== null && (
            <p className="mt-2 text-base text-graphite" role="status">
              {t.confirmingBot}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p id="quota-note" className="text-base text-graphite">
            {t.quotaNote}
            {quota && !exhausted && (
              <>
                {" "}
                <span className="text-ink">
                  {fmt(quota.remainingToday === 1 ? t.remainingOne : t.remainingMany, { n: quota.remainingToday })}
                </span>
              </>
            )}
            {exhausted && (
              <>
                {" "}
                <span className="text-ink">
                  {fmt(t.noneLeft, { time: resetTime })}
                </span>
              </>
            )}
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-sm bg-ink px-5 py-2.5 font-semibold text-paper hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy || pending !== null ? t.checking : t.submit}
          </button>
        </div>
      </form>

      <div ref={resultRef} tabIndex={-1} aria-live="polite" aria-busy={busy} className="mt-10 outline-none">
        {started && <Timeline state={timeline} />}
        {error && (
          <p role="alert" className="reveal mt-6 border-l-4 border-ink px-4 py-2">
            {error}
          </p>
        )}
        {answer && <AnswerView answer={answer} />}
      </div>
    </div>
  );
}
