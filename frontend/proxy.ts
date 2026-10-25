import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n";

/**
 * English keeps its original unprefixed URLs (/, /about, /privacy): they are rewritten to /en/... internally,
 * and /en/... redirects back to them so each page has one address. Chinese pages live under /zh-TW and /zh-CN.
 * On the home page only, a first-time visitor whose browser prefers Chinese is sent to that version;
 * once they pick a language (cookie), we never guess again.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(1 + DEFAULT_LOCALE.length) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (isLocale(first)) return NextResponse.next();

  if (pathname === "/" && !request.cookies.has(LOCALE_COOKIE)) {
    const preferred = preferredChinese(request.headers.get("accept-language"));
    if (preferred) {
      const url = request.nextUrl.clone();
      url.pathname = `/${preferred}`;
      return NextResponse.redirect(url, 307);
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

/** Only when Chinese is the browser's first choice; anything else gets English. */
function preferredChinese(header: string | null): Locale | null {
  const top = (header ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((x) => x.tag && x.tag !== "*")
    .sort((a, b) => b.q - a.q)[0]?.tag;
  if (!top?.startsWith("zh")) return null;
  return /^zh-(tw|hk|mo|hant)/.test(top) ? "zh-TW" : "zh-CN";
}

export const config = {
  // Pages only: not the API, Next's assets, metadata routes, or files with an extension (robots.txt, llms.txt...).
  matcher: ["/((?!api/|_next/|opengraph-image|.*\\..*).*)"],
};
