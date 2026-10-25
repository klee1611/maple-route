import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/site";
import { PrivacyEn } from "./en";
import { PrivacyZhCN } from "./zh-CN";
import { PrivacyZhTW } from "./zh-TW";

const CONTENT = { en: PrivacyEn, "zh-TW": PrivacyZhTW, "zh-CN": PrivacyZhCN };

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { meta } = getDictionary(lang);
  return pageMetadata({ locale: lang, title: meta.privacyTitle, description: meta.privacyDescription, path: "/privacy" });
}

export default async function Privacy({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  const Content = CONTENT[isLocale(lang) ? lang : "en"];
  return (
    <Prose>
      <Content />
    </Prose>
  );
}
