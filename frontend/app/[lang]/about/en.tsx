import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { REPO_URL, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "How Maple Route answers Canadian immigration questions: AI agents that read only official IRCC and Ontario sources, cite every statement, and flag rules that have changed.",
  path: "/about",
});

export default function About() {
  return (
    <Prose>
      <h1>How Maple Route works</h1>
      <p>
        Maple Route answers questions about Canadian work permits and permanent residence for tech workers, mainly
        in Ontario. It only uses official sources, shows a source for every statement, and tells you when a rule you
        may have read about has changed.
      </p>

      <h2>How an answer is made</h2>
      <p>Four AI agents work in turn, each with one job. A final step assembles what they found.</p>
      <ol>
        <li>
          <strong>Understanding your situation.</strong> Picks out the facts you give (job, location, education,
          status) and any rule you mention as true, so it can be checked.
        </li>
        <li>
          <strong>Checking current rules.</strong> Reads the most relevant entries in the Knowledge Base, including
          entries that record when rules changed, and keeps each statement with its source.
        </li>
        <li>
          <strong>Writing the answer.</strong> Writes in plain language using only those statements. A statement
          without a source is removed.
        </li>
        <li>
          <strong>Verifying sources.</strong> Checks every statement, and every rule you mentioned, against the
          source text. If something is outdated, it sends the answer back to be rechecked (up to two times).
        </li>
        <li>
          <strong>Showing what changed.</strong> When a rule changed, the answer shows a “Changed” note with what the
          older rule said and what the current rule says, each with its source.
        </li>
      </ol>

      <h2>The Knowledge Base</h2>
      <p>
        All policy information comes from a{" "}
        <a href="https://www.sanity.io/docs/ai/sanity-context-knowledge-bases">Sanity Knowledge Base</a>, read through
        Sanity Context. It is built from official pages on canada.ca (IRCC and ESDC) and ontario.ca (the Ontario
        Immigrant Nominee Program). The Knowledge Base organises these pages into topic entries, keeps a citation back
        to the page and section each statement comes from, and records when rules changed.
      </p>
      <p>
        <strong>Freshness:</strong> the official web pages are connected as live sources, and the Knowledge Base
        re-checks them on its refresh schedule, so answers follow the current version of each page.
      </p>
      <p>The official pages it is built from:</p>
      <ul>
        <li>
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html">
            Express Entry: Comprehensive Ranking System criteria
          </a>{" "}
          (canada.ca)
        </li>
        <li>
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/special-instructions/spouses-dependent-children/eligibility.html">
            Open work permits for spouses and family members: who is eligible
          </a>{" "}
          (canada.ca)
        </li>
        <li>
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html">
            Post-graduation work permit: who is eligible
          </a>{" "}
          (canada.ca)
        </li>
        <li>
          <a href="https://www.ontario.ca/page/2026-ontario-immigrant-nominee-program-updates">
            2026 Ontario Immigrant Nominee Program updates
          </a>{" "}
          (ontario.ca)
        </li>
        <li>
          A few related pages from{" "}
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship.html">
            Immigration, Refugees and Citizenship Canada
          </a>
          , such as the Global Talent Stream
        </li>
      </ul>

      <h2>Limitations</h2>
      <ul>
        <li>This is information, not legal advice. For your case, talk to a licensed immigration consultant (RCIC) or lawyer.</li>
        <li>It covers a focused set of topics for tech workers in Ontario. If the sources don’t cover your question, it says so.</li>
        <li>
          It runs on free services, so the number of answers per day is limited, and it can be slow or busy for a
          minute at a time.
        </li>
        <li>It is not affiliated with the Government of Canada or the Government of Ontario.</li>
      </ul>

      <h2>Credits</h2>
      <p>
        Built for the{" "}
        <a href="https://dev.to/challenges/sanity-2026-09-16">DEV.to Sanity Challenge</a> (Path One: an agent that
        queries real content).
      </p>
      <p>
        Built and maintained by an independent developer, not a licensed immigration consultant. The code is open
        source on <a href={REPO_URL}>GitHub</a>, where you can also report a wrong or outdated answer.
      </p>
    </Prose>
  );
}
