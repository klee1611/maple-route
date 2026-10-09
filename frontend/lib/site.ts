import type { Metadata } from "next";

// Public production URL. Used for canonical links, the sitemap, and structured data.
export const SITE_URL = "https://maple-route.vercel.app";
export const SITE_NAME = "Maple Route";
export const REPO_URL = "https://github.com/klee1611/maple-route";
export const HOME_TITLE = "Maple Route: check Canadian work permit and PR rules, with sources";

const DEFAULT_DESCRIPTION =
  "Check which Canadian work permit and permanent residence rules apply to you, with a source for every statement. Not legal advice.";

/**
 * Per-page metadata. Next merges metadata shallowly, so a page that sets openGraph replaces the layout's
 * openGraph object entirely; building it here keeps og:title, og:url and the description in step.
 */
export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
}: {
  title?: string;
  description?: string;
  path: string;
}): Metadata {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : HOME_TITLE;
  // app/opengraph-image.tsx only reaches pages that don't set openGraph themselves, so point at it directly.
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME}: ${DEFAULT_DESCRIPTION}` };
  return {
    title: title ?? { absolute: HOME_TITLE },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_CA",
      url: path,
      title: fullTitle,
      description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
  };
}
