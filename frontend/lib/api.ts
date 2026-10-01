// Client for the Maple Route API (CLAUDE.md §6).

export type ClaimStatus = "unverified" | "supported" | "unsupported" | "outdated" | "conflict";

export type Claim = {
  id: string;
  text: string;
  source_id: string;
  source_title: string | null;
  source_url: string | null;
  source_date: string | null;
  status: ClaimStatus;
  note: string | null;
};

export type Conflict = { old: Claim; current: Claim | null };

export type Source = { n: number; title: string | null; url: string | null; date: string | null; entry: string };

export type Answer = {
  text: string;
  claims: Claim[];
  conflicts: Conflict[];
  sources: Source[];
  disclaimer: string;
  revisions: number;
  cached?: boolean;
};

export type Step = { agent: string; status: "started" | "finished" | "waiting"; summary: string };

export type ErrorCode = "quota_exhausted" | "rate_limited" | "upstream_busy" | "invalid_input" | "internal" | "network";

export type Quota = { remainingToday: number; resetsAt?: string };

export type AskHandlers = {
  onStep: (step: Step) => void;
  onClaim: (claim: Claim) => void;
  onAnswer: (answer: Answer) => void;
  onQuota: (quota: Quota) => void;
  onError: (code: ErrorCode, message: string) => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function getQuota(): Promise<Quota | null> {
  try {
    const res = await fetch(`${API_BASE}/api/quota`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as Quota) : null;
  } catch {
    return null;
  }
}

/** POST a question and dispatch Server-Sent Events as they arrive. */
export async function ask(question: string, turnstileToken: string, handlers: AskHandlers): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, turnstileToken }),
    });
  } catch {
    handlers.onError("network", "");
    return;
  }
  if (!res.ok || !res.body) {
    handlers.onError(res.status === 429 ? "rate_limited" : "internal", "");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawResult = false;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let end: number;
      while ((end = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const parsed = parseEvent(block);
        if (!parsed) continue;
        const { name, data } = parsed;
        if (name === "step") handlers.onStep(data as Step);
        else if (name === "claim") handlers.onClaim(data as Claim);
        else if (name === "answer") {
          sawResult = true;
          handlers.onAnswer(data as Answer);
        } else if (name === "quota") handlers.onQuota(data as Quota);
        else if (name === "error") {
          sawResult = true;
          const err = data as { code: ErrorCode; message: string };
          handlers.onError(err.code, err.message);
        }
      }
    }
  } catch {
    handlers.onError("network", "");
    return;
  }
  if (!sawResult) handlers.onError("network", "");
}

function parseEvent(block: string): { name: string; data: unknown } | null {
  let name = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!data.length) return null;
  try {
    return { name, data: JSON.parse(data.join("\n")) };
  } catch {
    return null;
  }
}
