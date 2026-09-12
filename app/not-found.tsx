import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <div className="flex h-full items-center justify-center text-center">
      <div>
        <p className="text-base font-semibold">{t(locale, "chrome.notFoundTitle")}</p>
        <p className="mt-1 text-[15px] text-ink-soft">{t(locale, "chrome.notFoundHint")}</p>
        <Link href="/" className="mt-4 inline-block underline">
          {t(locale, "chrome.notFoundBack")}
        </Link>
      </div>
    </div>
  );
}
