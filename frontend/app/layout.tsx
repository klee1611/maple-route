import type { Metadata } from "next";
import Link from "next/link";
import { Atkinson_Hyperlegible_Next, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";

// Reading text: designed for legibility (look-alike characters are distinct).
const reading = Atkinson_Hyperlegible_Next({ variable: "--font-reading", subsets: ["latin"] });
// Records: dates, citation numbers, source sections.
const record = IBM_Plex_Mono({ variable: "--font-record", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Maple Route",
  description:
    "Check which Canadian work permit and permanent residence rules apply to you, with a source for every statement. Not legal advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${reading.variable} ${record.variable}`}>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 sm:px-6">
          <header className="flex items-baseline justify-between gap-4 border-b border-rule py-5">
            <Link href="/" className="text-xl font-semibold tracking-tight text-ink no-underline">
              Maple Route
            </Link>
            <nav aria-label="Site" className="flex gap-5 text-base">
              <Link href="/about" className="text-graphite underline hover:text-ink">
                About
              </Link>
              <Link href="/privacy" className="text-graphite underline hover:text-ink">
                Privacy
              </Link>
            </nav>
          </header>
          <main className="flex-1 py-8">{children}</main>
          <footer className="flex flex-col gap-4 border-t border-rule py-6 text-sm text-graphite sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-prose">
              A free, independent project. Not affiliated with the Government of Canada or any
              government agency. Information, not legal advice.
            </p>
            {/* A plain link, not Buy Me a Coffee's widget: no third-party script or tracking. */}
            <a
              href="https://www.buymeacoffee.com/klee1611"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded border border-rule px-3 py-2 text-ink no-underline hover:border-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-editor sm:self-auto"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <path d="M6 2v2M10 2v2M14 2v2" />
              </svg>
              Buy me a coffee
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
