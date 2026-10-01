"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ask, getQuota, type Answer, type ErrorCode, type Quota } from "@/lib/api";
import { AnswerView } from "./AnswerView";
import { Timeline, applyStep, emptyTimeline, type TimelineState } from "./Timeline";
import { Turnstile, type TurnstileHandle } from "./Turnstile";

const MAX_CHARS = 1000;

const EXAMPLES = [
  {
    label: "PGWP after two years?",
    question: "I graduated from a Canadian college program two years ago. Can I still get a post-graduation work permit?",
  },
  {
    label: "Spouse open work permit?",
    question: "Does my spouse get an open work permit if I come to Canada on a work permit?",
  },
  { label: "Express Entry job offer points?", question: "Do I get extra Express Entry points for a job offer?" },
  {
    label: "OINP tech stream still open?",
    question:
      "I read that tech workers in Ontario can get invited through the OINP Express Entry Human Capital Priorities stream. Can I still apply that way?",
  },
];

function formatReset(resetsAt?: string): string {
  if (!resetsAt) return "tomorrow";
  const d = new Date(resetsAt);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(d);
}

function errorText(code: ErrorCode, message: string, resetsAt?: string): string {
  switch (code) {
    case "quota_exhausted":
      return `The free daily limit has been reached. Answers are available again at ${formatReset(resetsAt)}.`;
    case "rate_limited":
      return message || "You've asked several questions in the last hour. Please try again later.";
    case "upstream_busy":
      return "The free AI service is busy right now. Please wait a minute, then try again.";
    case "invalid_input":
      return message || "Please check your question and try again.";
    case "network":
      return "We couldn't reach the server. Check your connection and try again.";
    default:
      return "Something went wrong on our side. Please try again.";
  }
}

export function Checker() {
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
  const tooLong = question.length > MAX_CHARS;
  const canSubmit = !busy && !exhausted && !tooLong && question.trim().length > 0 && pending === null;

  async function submit(q: string, t: string | null = token) {
    if (busy || exhausted) return;
    if (t === null) {
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
    await ask(q.trim(), t, {
      onStep: (step) => setTimeline((prev) => applyStep(prev, step)),
      onClaim: () => {},
      onAnswer: setAnswer,
      onQuota: (next) => setQuota((prev) => ({ ...prev, ...next })),
      onError: (code, message) => setError(errorText(code, message, quota?.resetsAt)),
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
        Check which Canadian work permit and PR rules apply to you — and whether what you read is still true.
      </h1>
      <p className="mt-3 max-w-[68ch] text-graphite">
        For tech workers in or coming to Ontario. Every statement links to its official source.
      </p>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) submit(question);
        }}
      >
        <label htmlFor="question" className="block font-semibold">
          Your situation or question
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          disabled={exhausted}
          aria-describedby="question-count quota-note"
          placeholder="For example: I'm a software developer in Toronto with a job offer. Which work permits can I get?"
          className="mt-2 block w-full resize-y rounded-sm border border-rule bg-field px-3 py-2.5 text-ink placeholder:text-graphite disabled:opacity-60"
        />
        <p
          id="question-count"
          className={`mt-1 text-right font-mono text-sm ${tooLong ? "text-editor" : "text-graphite"}`}
          aria-live={tooLong ? "polite" : "off"}
        >
          {question.length} / {MAX_CHARS}
          {tooLong && " — please shorten your question"}
        </p>

        <div className="mt-2">
          <p className="text-base text-graphite" id="examples-label">
            Or try an example:
          </p>
          <ul aria-labelledby="examples-label" className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
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
              Confirming you’re not a bot — your question will be sent in a moment.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p id="quota-note" className="text-base text-graphite">
            This is a free project with a limited number of answers per day.
            {quota && !exhausted && (
              <>
                {" "}
                <span className="text-ink">
                  {quota.remainingToday} answer{quota.remainingToday === 1 ? "" : "s"} left today.
                </span>
              </>
            )}
            {exhausted && (
              <>
                {" "}
                <span className="text-ink">
                  No answers left today. Available again at {formatReset(quota?.resetsAt)}.
                </span>
              </>
            )}
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-sm bg-ink px-5 py-2.5 font-semibold text-paper hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy || pending !== null ? "Checking…" : "Check my options"}
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
