"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, localePath, stripLocale } from "@/lib/i18n";
import { useI18n } from "./I18n";

/**
 * One button showing the current language; it opens a list of plain links, each written in its own language.
 * A disclosure, not an ARIA menu: Tab moves through the links, Escape or clicking elsewhere closes it.
 * Choosing a language is remembered for a year.
 */
export function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const path = stripLocale(usePathname() ?? "/");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav
      ref={root}
      aria-label={dict.nav.language}
      className="relative"
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="language-list"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-10 items-center gap-1 rounded-sm border border-rule px-2 text-sm text-ink hover:border-ink sm:gap-1.5 sm:px-2.5 sm:text-base"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span className="sr-only">{dict.nav.language}: </span>
        <span lang={locale}>{LOCALE_NAMES[locale]}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className={`hidden h-3.5 w-3.5 shrink-0 sm:block ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          id="language-list"
          className="absolute right-0 z-20 mt-1 min-w-full w-max rounded-sm border border-rule bg-field py-1 shadow-sm"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <Link
                href={localePath(l, path)}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? "true" : undefined}
                onClick={() => {
                  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
                  setOpen(false);
                }}
                className="flex min-h-11 items-center gap-2 px-3 text-base text-ink no-underline hover:bg-editor-wash"
              >
                <span aria-hidden className="w-4 text-checked">
                  {l === locale ? "✓" : ""}
                </span>
                {LOCALE_NAMES[l]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
