import type { MetadataRoute } from "next";
import { LOCALES, localePath } from "@/lib/i18n";
import { SITE_URL, languageAlternates } from "@/lib/site";

const PAGES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
] as const;

/** One entry per page and language, each listing all its language versions. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ path, changeFrequency, priority }) =>
    LOCALES.map((locale) => ({
      url: SITE_URL + (path === "/" && locale === "en" ? "" : localePath(locale, path)),
      changeFrequency,
      priority,
      alternates: { languages: languageAlternates(path, SITE_URL) },
    })),
  );
}
