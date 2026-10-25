// Interface text. Placeholders like {n} are filled with fmt() from lib/i18n.ts.
// Translations: zh-TW.ts and zh-CN.ts must have exactly these keys (the Dictionary type enforces it).

export const en = {
  meta: {
    homeTitle: "Maple Route: check Canadian work permit and PR rules, with sources",
    description:
      "Check which Canadian work permit and permanent residence rules apply to you, with a source for every statement. Not legal advice.",
    appDescription:
      "Answers questions about Canadian work permits and permanent residence for tech workers, citing official sources for every statement and flagging rules that have changed. Information, not legal advice.",
    aboutTitle: "About",
    aboutDescription:
      "How Maple Route answers Canadian immigration questions: AI agents that read only official IRCC and Ontario sources, cite every statement, and flag rules that have changed.",
    privacyTitle: "Privacy",
    privacyDescription:
      "What Maple Route stores: no accounts and no saved conversations. Analytics only if you allow it.",
  },
  nav: {
    site: "Site",
    about: "About",
    privacy: "Privacy",
    language: "Language",
  },
  footer: {
    notice:
      "A free, independent project. Not affiliated with the Government of Canada or any government agency. Information, not legal advice.",
    coffee: "Buy me a coffee",
    newTab: "(opens in a new tab)",
  },
  home: {
    heading: "Check which Canadian work permit and PR rules apply to you — and whether what you read is still true.",
    intro: "For tech workers in or coming to Ontario. Every statement links to its official source.",
    label: "Your situation or question",
    placeholder: "For example: I'm a software developer in Toronto with a job offer. Which work permits can I get?",
    tooLong: " — please shorten your question",
    examplesLabel: "Or try an example:",
    examples: [
      {
        label: "PGWP after two years?",
        question:
          "I graduated from a Canadian college program two years ago. Can I still get a post-graduation work permit?",
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
    ],
    confirmingBot: "Confirming you’re not a bot — your question will be sent in a moment.",
    quotaNote: "This is a free project with a limited number of answers per day.",
    remainingOne: "{n} answer left today.",
    remainingMany: "{n} answers left today.",
    noneLeft: "No answers left today. Available again at {time}.",
    tomorrow: "tomorrow",
    submit: "Check my options",
    checking: "Checking…",
  },
  errors: {
    quota_exhausted: "The free daily limit has been reached. Answers are available again at {time}.",
    rate_limited: "You've asked several questions recently. Please try again in an hour or tomorrow.",
    upstream_busy: "The free AI service is busy right now. Please wait a minute, then try again.",
    invalid_input: "Please check your question and try again.",
    network: "We couldn't reach the server. Check your connection and try again.",
    internal: "Something went wrong on our side. Please try again.",
  },
  timeline: {
    progress: "Progress",
    orchestrator: "Understanding your situation",
    policy_agent: "Checking current rules",
    synthesizer: "Writing the answer",
    verifier: "Verifying sources",
    notStarted: "Not started",
    done: "Done",
    waiting: "Waiting",
    inProgress: "In progress",
    recheck: "Found a rule that changed — rechecking",
    rechecked: "Found a rule that changed — rechecked",
  },
  answer: {
    heading: "Your answer",
    cached: "Answered earlier today — shown from saved results.",
    sourceChecked: "Source {n}, checked against its text",
    sourceDisagree: "Source {n}, sources disagree",
    legendChecked: "Checked against its source",
    legendDisagree: "Sources disagree",
    whatYouRead: "What you read or mentioned",
    changed: "Changed",
    disagree: "Sources disagree",
    before: "Before",
    now: "Now",
    formerRule: "Former or incorrect rule: ",
    noLongerSupported: "Current sources no longer support this.",
    checkedAgainstKb: "Checked against the Knowledge Base",
    sources: "Sources",
    kbEntry: "Knowledge Base entry: {entry}",
    olderSource: "Older source, quoted under “Before”",
    officialEnglish: "Official sources are in English.",
  },
  analytics: {
    region: "Analytics choice",
    prompt: "Can we use Google Analytics to count visits? It sets cookies. Your questions are never sent to Google.",
    privacy: "Privacy",
    allow: "Allow analytics",
    decline: "No thanks",
    current: "Your current choice:",
    allowed: "allowed",
    declined: "declined",
    notChosen: "not chosen yet",
    turnOff: "Turn analytics off",
    period: ".",
  },
  notFound: {
    title: "Page not found",
    body: "There is no page at this address.",
    home: "Go to the question page",
  },
};

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof en>;
