"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n";

type I18n = { locale: Locale; dict: Dictionary };

const I18nContext = createContext<I18n | null>(null);

/** Gives client components the page's language. The layout passes only that language's dictionary. */
export function I18nProvider({ locale, dict, children }: I18n & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n outside I18nProvider");
  return value;
}
