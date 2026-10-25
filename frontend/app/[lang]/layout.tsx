import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Atkinson_Hyperlegible_Next, IBM_Plex_Mono } from "next/font/google";
import "../globals.css";
import { Analytics } from "@/components/Analytics";
import { I18nProvider } from "@/components/I18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getDictionary } from "@/lib/dictionaries";
import { LOCALES, isLocale, localePath } from "@/lib/i18n";
import { REPO_URL, SITE_NAME, SITE_URL } from "@/lib/site";

// Reading text: designed for legibility (look-alike characters are distinct).
const reading = Atkinson_Hyperlegible_Next({ variable: "--font-reading", subsets: ["latin"] });
// Records: dates, citation numbers, source sections.
const record = IBM_Plex_Mono({ variable: "--font-record", subsets: ["latin"], weight: ["400", "500"] });

// Every language is built ahead of time; any other first segment is not a language (see proxy.ts).
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: getDictionary(lang).meta.homeTitle, template: `%s · ${SITE_NAME}` },
    applicationName: SITE_NAME,
  };
}

// Describes the tool to search engines. No FAQ or HowTo markup: Google no longer shows those for sites like this.
function jsonLd(lang: string, description: string, url: string) {
  const inLanguage = lang === "en" ? "en-CA" : lang;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: ["en-CA", "zh-TW", "zh-CN"],
      },
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        url,
        name: SITE_NAME,
        description,
        applicationCategory: "ReferenceApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
        inLanguage,
        sameAs: [REPO_URL],
      },
    ],
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const home = localePath(lang, "/");
  const structured = jsonLd(lang, dict.meta.appDescription, SITE_URL + (home === "/" ? "/" : home));
  return (
    <html lang={lang} className={`${reading.variable} ${record.variable}`}>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <script
          type="application/ld+json"
          // Static object defined above; escape "<" so the JSON can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}
        />
        <I18nProvider locale={lang} dict={dict}>
        <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 sm:px-6">
          <header className="border-b border-rule py-5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:gap-x-4">
              <Link href={home} className="text-lg font-semibold tracking-tight text-ink no-underline sm:text-xl">
                Maple Route
              </Link>
              <div className="flex items-center gap-3 sm:gap-5">
                <nav aria-label={dict.nav.site} className="flex gap-3 text-base sm:gap-5">
                  <Link href={localePath(lang, "/about")} className="py-2 text-graphite underline hover:text-ink">
                    {dict.nav.about}
                  </Link>
                  <Link href={localePath(lang, "/privacy")} className="py-2 text-graphite underline hover:text-ink">
                    {dict.nav.privacy}
                  </Link>
                </nav>
                <LanguageSwitcher />
              </div>
            </div>
          </header>
          <main className="flex-1 py-8">{children}</main>
          <footer className="flex flex-col gap-4 border-t border-rule py-6 text-sm text-graphite sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-prose">{dict.footer.notice}</p>
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
              {dict.footer.coffee}
              <span className="sr-only">{dict.footer.newTab}</span>
            </a>
          </footer>
        </div>
        <Analytics />
        </I18nProvider>
      </body>
    </html>
  );
}
