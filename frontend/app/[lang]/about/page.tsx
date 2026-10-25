import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/site";
import { AboutEn } from "./en";
import { AboutZhCN } from "./zh-CN";
import { AboutZhTW } from "./zh-TW";

const CONTENT = { en: AboutEn, "zh-TW": AboutZhTW, "zh-CN": AboutZhCN };

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { meta } = getDictionary(lang);
  return pageMetadata({ locale: lang, title: meta.aboutTitle, description: meta.aboutDescription, path: "/about" });
}

export default async function About({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  const Content = CONTENT[isLocale(lang) ? lang : "en"];
  return (
    <Prose>
      <Content />
    </Prose>
  );
}
