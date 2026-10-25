import type { Answer, Claim, Conflict, Source } from "@/lib/api";
import { fmt } from "@/lib/i18n";
import { useI18n } from "./I18n";

/** A source in the list below the answer. `older` marks one cited only on the "Before" side of a callout. */
type Cited = Source & { older?: boolean };

/** The key finalize numbers sources by: URL, else citation title. */
function sourceKey(url: string | null, title: string | null): string | null {
  return url ?? title;
}

/** The answer's sources, then any source a callout cites that the answer text doesn't, so every citation has a number. */
function numberSources(answer: Answer): Cited[] {
  const list: Cited[] = [...answer.sources];
  const seen = new Set(list.map((s) => sourceKey(s.url, s.title)));
  let next = Math.max(0, ...list.map((s) => s.n)) + 1;
  for (const { old, current } of answer.conflicts) {
    for (const c of [old, current]) {
      const key = c && sourceKey(c.source_url, c.source_title);
      if (!c || !c.source_title || seen.has(key)) continue;
      seen.add(key);
      list.push({ n: next++, title: c.source_title, url: c.source_url, date: c.source_date, entry: c.source_id, older: c === old });
    }
  }
  return list;
}

/** Render "text [1][2]" with each citation marker linked to the sources list and showing its claim's status. */
function Paragraph({ text, disputed }: { text: string; disputed: Set<number> }) {
  const t = useI18n().dict.answer;
  const parts = text.split(/(\[\d+\])/g).filter(Boolean);
  return (
    <p className="reveal">
      {parts.map((part, i) => {
        const m = /^\[(\d+)\]$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        const disagree = disputed.has(Number(m[1]));
        return (
          <a
            key={i}
            href={`#source-${m[1]}`}
            className="whitespace-nowrap font-mono text-base text-graphite no-underline hover:text-ink hover:underline"
            aria-label={fmt(disagree ? t.sourceDisagree : t.sourceChecked, { n: m[1] })}
          >
            [{m[1]}]
            <span aria-hidden className={disagree ? "text-editor" : "text-checked"}>
              {disagree ? "⚠" : "✓"}
            </span>
          </a>
        );
      })}
    </p>
  );
}

function SourceRef({ claim, n }: { claim: Claim; n: number | undefined }) {
  const t = useI18n().dict.answer;
  if (!claim.source_title) return <span>{t.whatYouRead}</span>;
  const label = shortTitle(claim.source_title);
  return (
    <span>
      {n !== undefined && (
        <>
          <a
            href={`#source-${n}`}
            className="font-mono no-underline hover:text-ink hover:underline"
            aria-label={fmt(t.sourceChecked, { n })}
          >
            [{n}]
          </a>{" "}
        </>
      )}
      {claim.source_url ? (
        <a href={claim.source_url} target="_blank" rel="noopener noreferrer" hrefLang="en" lang="en" className="underline">
          {label}
        </a>
      ) : (
        label
      )}
      {claim.source_date && <span className="whitespace-nowrap font-mono"> · {claim.source_date}</span>}
    </span>
  );
}

/** "Page title - Canada.ca § Section › Sub" -> "Page title - Canada.ca" for compact labels. */
function shortTitle(title: string): string {
  return title.split(" § ")[0];
}

/** The signature element: what an older rule (or the user's premise) said vs. the rule now. */
function ChangedCallout({ conflict, numberOf }: { conflict: Conflict; numberOf: (c: Claim) => number | undefined }) {
  const t = useI18n().dict.answer;
  const { old, current } = conflict;
  const label = old.status === "conflict" ? t.disagree : t.changed;
  return (
    <aside
      className="reveal my-6 border-l-4 border-editor bg-editor-wash px-4 py-4 sm:px-5"
      aria-label={`${label}: ${old.note ?? ""}`}
    >
      <p className="font-mono text-sm font-medium text-editor">
        <span aria-hidden>↻ </span>
        {label}
      </p>
      {old.note && <p className="mt-2 text-ink">{old.note}</p>}
      <dl className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-[5.5rem_1fr]">
        <dt className="font-mono text-sm text-graphite sm:pt-1">{t.before}</dt>
        <dd>
          <span className="sr-only">{t.formerRule}</span>
          <s className="text-graphite decoration-editor/60">{old.text}</s>
          <span className="mt-1 block text-sm text-graphite">
            <SourceRef claim={old} n={numberOf(old)} />
          </span>
        </dd>
        <dt className="font-mono text-sm text-graphite sm:pt-1">{t.now}</dt>
        <dd>
          {current ? (
            <>
              {current.text}
              <span className="mt-1 block text-sm text-graphite">
                <SourceRef claim={current} n={numberOf(current)} />
              </span>
            </>
          ) : (
            <span>{t.noLongerSupported}</span>
          )}
          <span className="mt-2 block text-sm text-checked">
            <span aria-hidden>✓</span> {t.checkedAgainstKb}
          </span>
        </dd>
      </dl>
    </aside>
  );
}

function SourcesList({ sources }: { sources: Cited[] }) {
  const { locale, dict } = useI18n();
  const t = dict.answer;
  if (!sources.length) return null;
  return (
    <section aria-labelledby="sources-heading" className="mt-8 border-t border-rule pt-5">
      <h3 id="sources-heading" className="text-lg font-semibold">
        {t.sources}
      </h3>
      {locale !== "en" && <p className="mt-1 text-sm text-graphite">{t.officialEnglish}</p>}
      <ol className="mt-3 space-y-4">
        {sources.map((s) => {
          const [page, section] = (s.title ?? "").split(" § ");
          return (
            <li key={s.n} id={`source-${s.n}`} className="flex scroll-mt-6 gap-3">
              <span className="w-8 shrink-0 font-mono text-graphite">[{s.n}]</span>
              <div className="min-w-0">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" hrefLang="en" lang="en" className="break-words underline">
                    {page}
                  </a>
                ) : (
                  <span>{page}</span>
                )}
                {s.older && <p className="text-sm text-graphite">{t.olderSource}</p>}
                {section && <p className="font-mono text-sm [overflow-wrap:anywhere] text-graphite">§ {section}</p>}
                <p className="font-mono text-sm [overflow-wrap:anywhere] text-graphite">
                  {s.date ? `${s.date} · ` : ""}
                  {fmt(t.kbEntry, { entry: s.entry })}
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
  const t = useI18n().dict.answer;
  const paragraphs = answer.text.split(/\n{2,}/).filter(Boolean);
  const sources = numberSources(answer);
  const numbers = new Map(sources.map((s) => [sourceKey(s.url, s.title), s.n]));
  const numberOf = (c: Claim) => numbers.get(sourceKey(c.source_url, c.source_title));
  // Kept claims are "supported" or "conflict"; a marker whose source has a conflicting claim shows that.
  const disputed = new Set(
    answer.claims.filter((c) => c.status === "conflict").flatMap((c) => numberOf(c) ?? []),
  );
  const cited = paragraphs.some((p) => /\[\d+\]/.test(p));
  return (
    <article aria-labelledby="answer-heading" className="mt-8">
      <h2 id="answer-heading" className="text-2xl font-semibold">
        {t.heading}
      </h2>
      {answer.cached && (
        <p className="mt-1 text-sm text-graphite">{t.cached}</p>
      )}
      {cited && (
        <p className="mt-1 text-sm text-graphite">
          <span aria-hidden className="text-checked">✓</span> {t.legendChecked}
          {disputed.size > 0 && (
            <>
              {" · "}
              <span aria-hidden className="text-editor">⚠</span> {t.legendDisagree}
            </>
          )}
        </p>
      )}
      {/* What changed comes first: the question is often whether something read elsewhere is still true. */}
      {answer.conflicts.map((c, i) => (
        <ChangedCallout key={i} conflict={c} numberOf={numberOf} />
      ))}
      <div className="mt-4 max-w-[68ch] space-y-4">
        {paragraphs.map((p, i) => (
          <Paragraph key={i} text={p} disputed={disputed} />
        ))}
      </div>
      <SourcesList sources={sources} />
      <div className="mt-8 border-t border-rule pt-5">
        <p className="max-w-[68ch] text-base text-graphite">{answer.disclaimer}</p>
      </div>
    </article>
  );
}
