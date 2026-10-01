import type { Step } from "@/lib/api";

export const AGENTS = ["orchestrator", "policy_agent", "synthesizer", "verifier"] as const;

const LABELS: Record<string, string> = {
  orchestrator: "Understanding your situation",
  policy_agent: "Checking current rules",
  synthesizer: "Writing the answer",
  verifier: "Verifying sources",
};

export type TimelineState = {
  steps: Record<string, Step | undefined>;
  rechecks: number; // times the verifier sent the draft back
};

export const emptyTimeline: TimelineState = { steps: {}, rechecks: 0 };

/** Fold one `step` event into the timeline. A policy_agent restart after the verifier is a recheck. */
export function applyStep(state: TimelineState, step: Step): TimelineState {
  const steps = { ...state.steps };
  let rechecks = state.rechecks;
  if (step.agent === "policy_agent" && step.status === "started" && steps.verifier) {
    rechecks += 1;
    delete steps.synthesizer;
    delete steps.verifier;
  }
  steps[step.agent] = step;
  return { steps, rechecks };
}

function Icon({ step }: { step: Step | undefined }) {
  if (!step) return <span aria-hidden className="text-graphite">○</span>;
  if (step.status === "finished") return <span aria-hidden className="reveal text-checked">✓</span>;
  if (step.status === "waiting") return <span aria-hidden className="text-editor">◷</span>;
  return <span aria-hidden className="text-ink">◐</span>;
}

function statusWord(step: Step | undefined): string {
  if (!step) return "Not started";
  if (step.status === "finished") return "Done";
  if (step.status === "waiting") return "Waiting";
  return "In progress";
}

export function Timeline({ state }: { state: TimelineState }) {
  return (
    <section aria-label="Progress" className="border-y border-rule py-4">
      <ol className="space-y-1.5">
        {AGENTS.map((agent) => {
          const step = state.steps[agent];
          const detail = step?.status === "started" ? "" : step?.summary;
          return (
            <li key={agent} className="flex gap-3">
              <span className="w-5 shrink-0 text-center font-mono">
                <Icon step={step} />
              </span>
              <span className={step ? "text-ink" : "text-graphite"}>
                {LABELS[agent]}
                <span className="sr-only">: {statusWord(step)}</span>
                {detail && <span className="reveal text-graphite"> · {detail}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {state.rechecks > 0 && (
        <p className="reveal mt-3 flex gap-3 text-editor">
          <span aria-hidden className="w-5 shrink-0 text-center font-mono">↻</span>
          Found a rule that changed — rechecking{state.rechecks > 1 ? ` (${state.rechecks})` : ""}
        </p>
      )}
    </section>
  );
}
