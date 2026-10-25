import type { Locale } from "@/lib/i18n";
import { en, type Dictionary } from "./en";
import { zhCN } from "./zh-CN";
import { zhTW } from "./zh-TW";

const dictionaries: Record<Locale, Dictionary> = { en, "zh-TW": zhTW, "zh-CN": zhCN };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
