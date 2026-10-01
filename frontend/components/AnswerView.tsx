import type { Answer, Claim, Conflict, Source } from "@/lib/api";

/** Render "text [1][2]" with citation markers linked to the sources list. */
function Paragraph({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g).filter(Boolean);
  const cited = parts.some((p) => /^\[\d+\]$/.test(p));
  return (
    <p className="reveal">
      {parts.map((part, i) => {
        const m = /^\[(\d+)\]$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        return (
          <a
            key={i}
            href={`#source-${m[1]}`}
            className="font-mono text-base text-graphite no-underline hover:text-ink hover:underline"
            aria-label={`Source ${m[1]}`}
          >
            [{m[1]}]
          </a>
        );
      })}
      {cited && (
        <span className="ml-2 whitespace-nowrap text-sm text-checked">
          <span aria-hidden>✓</span> Checked
        </span>
      )}
    </p>
  );
}

function SourceRef({ claim }: { claim: Claim }) {
  if (!claim.source_title) return <span>What you read or mentioned</span>;
  const label = shortTitle(claim.source_title);
  return (
    <span>
      {claim.source_url ? (
        <a href={claim.source_url} target="_blank" rel="noopener noreferrer" className="underline">
          {label}
        </a>
      ) : (
        label
      )}
      {claim.source_date && <span> · {claim.source_date}</span>}
    </span>
  );
}

/** "Page title - Canada.ca § Section › Sub" -> "Page title - Canada.ca" for compact labels. */
function shortTitle(title: string): string {
  return title.split(" § ")[0];
}

/** The signature element: what an older rule (or the user's premise) said vs. the rule now. */
export function ChangedCallout({ conflict }: { conflict: Conflict }) {
  const { old, current } = conflict;
  const date = current?.source_date;
  const label = old.status === "conflict" ? "Sources disagree" : "Changed";
  return (
    <aside
      className="reveal my-6 border-l-4 border-editor bg-editor-wash px-4 py-4 sm:px-5"
      aria-label={`${label}: ${old.note ?? ""}`}
    >
      <p className="font-mono text-sm font-medium tracking-wide text-editor">
        <span aria-hidden>↻ </span>
        {label.toUpperCase()}
        {date && <span> · {date}</span>}
      </p>
      {old.note && <p className="mt-2 text-ink">{old.note}</p>}
      <dl className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-[5.5rem_1fr]">
        <dt className="font-mono text-sm text-graphite sm:pt-1">Before</dt>
        <dd>
          <span className="sr-only">Former or incorrect rule: </span>
          <s className="text-graphite decoration-editor/60">{old.text}</s>
          <span className="mt-1 block font-mono text-sm text-graphite">
            <SourceRef claim={old} />
          </span>
        </dd>
        <dt className="font-mono text-sm text-graphite sm:pt-1">Now</dt>
        <dd>
          {current ? (
            <>
              {current.text}
              <span className="mt-1 block font-mono text-sm text-graphite">
                <SourceRef claim={current} />
              </span>
            </>
          ) : (
            <span>Current sources no longer support this.</span>
          )}
          <span className="mt-2 block text-sm text-checked">
            <span aria-hidden>✓</span> Checked against the Knowledge Base
          </span>
        </dd>
      </dl>
    </aside>
  );
}

function SourcesList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <section aria-labelledby="sources-heading" className="mt-8 border-t border-rule pt-5">
      <h3 id="sources-heading" className="text-lg font-semibold">
        Sources
      </h3>
      <ol className="mt-3 space-y-4">
        {sources.map((s) => {
          const [page, section] = (s.title ?? "").split(" § ");
          return (
            <li key={s.n} id={`source-${s.n}`} className="flex scroll-mt-6 gap-3">
              <span className="w-8 shrink-0 font-mono text-graphite">[{s.n}]</span>
              <div className="min-w-0">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-words underline">
                    {page}
                  </a>
                ) : (
                  <span>{page}</span>
                )}
                {section && <p className="font-mono text-sm [overflow-wrap:anywhere] text-graphite">§ {section}</p>}
                <p className="font-mono text-sm [overflow-wrap:anywhere] text-graphite">
                  {s.date ? `${s.date} · ` : ""}Knowledge Base entry: {s.entry}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function AnswerView({ answer }: { answer: Answer }) {
  const paragraphs = answer.text.split(/\n{2,}/).filter(Boolean);
  return (
    <article aria-labelledby="answer-heading" className="mt-8">
      <h2 id="answer-heading" className="text-2xl font-semibold">
        Your answer
      </h2>
      {answer.cached && (
        <p className="mt-1 text-sm text-graphite">Answered earlier today — shown from saved results.</p>
      )}
      <div className="mt-4 max-w-[68ch] space-y-4">
        {paragraphs.map((p, i) => (
          <Paragraph key={i} text={p} />
        ))}
      </div>
      {answer.conflicts.map((c, i) => (
        <ChangedCallout key={i} conflict={c} />
      ))}
      <SourcesList sources={answer.sources} />
      <p className="mt-8 max-w-[68ch] border-t border-rule pt-5 text-base text-graphite">{answer.disclaimer}</p>
    </article>
  );
}
