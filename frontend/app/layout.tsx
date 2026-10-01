import type { Metadata } from "next";
import Link from "next/link";
import { Atkinson_Hyperlegible_Next, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

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
          <footer className="border-t border-rule py-6 text-sm text-graphite">
            <p>
              A free, independent project. Not affiliated with the Government of Canada or any
              government agency. Information, not legal advice.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
