import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { DEFAULT_LOCALE, LOCALES, OG_LOCALES, localePath, type Locale } from "@/lib/i18n";

// Public production URL. Used for canonical links, the sitemap, and structured data.
export const SITE_URL = "https://maple-route.vercel.app";
export const SITE_NAME = "Maple Route";
export const REPO_URL = "https://github.com/klee1611/maple-route";

/** hreflang links for one page: every language, plus x-default (English). */
export function languageAlternates(path: string, base = ""): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, base + localePath(l, path)])),
    "x-default": base + localePath(DEFAULT_LOCALE, path),
  };
}

/**
 * Per-page metadata. Next merges metadata shallowly, so a page that sets openGraph replaces the layout's
 * openGraph object entirely; building it here keeps og:title, og:url and the description in step.
 */
export function pageMetadata({
  locale,
  title,
  description,
  path,
}: {
  locale: Locale;
  title?: string;
  description?: string;
  path: string;
}): Metadata {
  const { meta } = getDictionary(locale);
  description ??= meta.description;
  const fullTitle = title ? `${title} · ${SITE_NAME}` : meta.homeTitle;
  const url = localePath(locale, path);
  // app/opengraph-image.tsx only reaches pages that don't set openGraph themselves, so point at it directly.
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME}: ${meta.description}` };
  return {
    title: title ?? { absolute: meta.homeTitle },
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      url,
      title: fullTitle,
      description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
  };
}
