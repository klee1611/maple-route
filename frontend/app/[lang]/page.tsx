import type { Metadata } from "next";
import { Checker } from "@/components/Checker";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? pageMetadata({ locale: lang, path: "/" }) : {};
}

export default function Home() {
  return <Checker />;
}
