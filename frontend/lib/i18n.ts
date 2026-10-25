// Locales, URL helpers, and string formatting. Safe to import from client components:
// the dictionaries themselves load on the server (lib/dictionaries.ts) and reach the client through I18nProvider.

export const LOCALES = ["en", "zh-TW", "zh-CN"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Each language names itself, so a reader can find theirs whatever the page language is. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
};

export const OG_LOCALES: Record<Locale, string> = { en: "en_CA", "zh-TW": "zh_TW", "zh-CN": "zh_CN" };

/** Cookie the language links set, so the proxy stops guessing from Accept-Language. */
export const LOCALE_COOKIE = "lang";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** English lives at the unprefixed URLs it always had; other languages under /zh-TW, /zh-CN. */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** "/zh-TW/about" -> "/about". */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (!isLocale(first)) return pathname || "/";
  return rest.length ? `/${rest.join("/")}` : "/";
}

/** Fill "{name}" placeholders. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
