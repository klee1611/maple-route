import type { Metadata } from "next";
import { AnalyticsSettings } from "@/components/Analytics";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Privacy · Maple Route" };

export default function Privacy() {
  return (
    <Prose>
      <h1>Privacy</h1>
      <p>Maple Route has no accounts and does not keep your conversations.</p>

      <h2>What is stored</h2>
      <ul>
        <li>
          <strong>Your questions are not saved in a database.</strong> Your question and answer stay in this browser tab
          only, and disappear when you leave or reload the page.
        </li>
        <li>
          <strong>Saved answers (12 hours).</strong> To save free capacity, the final answer is kept for up to 12 hours
          under a scrambled code (a hash) made from the question. The question text itself is not stored.
        </li>
        <li>
          <strong>Usage limits (1 hour to 2 days).</strong> To limit questions per hour, we count requests under a
          hash of your IP address for one hour, plus one shared daily counter. Your IP address itself is not stored.
        </li>
        <li>
          <strong>Debugging traces.</strong> We use LangSmith to see which steps ran, how long they took, and how many
          AI tokens they used. In the public app, the text of questions and answers is hidden from these traces.
        </li>
      </ul>

      <h2>Analytics (only if you allow it)</h2>
      <p>
        If you click “Allow analytics”, we use Google Analytics to count visits and see which pages are used. It sets
        cookies and sends Google information such as the pages you view, your browser and device type, and your
        approximate location. <strong>Your questions and answers are never sent to Google.</strong> If you choose “No
        thanks”, Google Analytics is not loaded at all. Your choice is saved in this browser only.
      </p>
      <AnalyticsSettings />

      <h2>Services involved</h2>
      <p>
        Questions are sent to Groq (the AI model provider) to write and check answers, and the Knowledge Base is read
        from Sanity. Bot protection uses Cloudflare Turnstile. Each of these services has its own privacy policy.
      </p>

      <h2>Please don’t share sensitive details</h2>
      <p>
        You don’t need to include your name, passport number, or other personal identifiers to get an answer. Describe
        your situation in general terms.
      </p>

      <h2>Contact</h2>
      <p>Questions about this page? Leave a comment on the project’s DEV.to post.</p>
    </Prose>
  );
}
