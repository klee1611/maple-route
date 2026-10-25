import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary } from "@/lib/dictionaries";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n";

export default async function NotFound() {
  const value = await lang();
  const locale = isLocale(value) ? value : DEFAULT_LOCALE;
  const { notFound } = getDictionary(locale);
  return (
    <div className="max-w-[68ch] space-y-4">
      <h1 className="text-3xl font-semibold">{notFound.title}</h1>
      <p>{notFound.body}</p>
      <p>
        <Link href={localePath(locale, "/")} className="underline">
          {notFound.home}
        </Link>
      </p>
    </div>
  );
}
