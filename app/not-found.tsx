import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <div className="flex h-full items-center justify-center text-center">
      <div>
        <p className="text-[22px] font-semibold tracking-tight text-ink">{t(locale, "chrome.notFoundTitle")}</p>
        <p className="mt-2 text-[14px] leading-6 text-ink-soft">{t(locale, "chrome.notFoundHint")}</p>
        <Link href="/" className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-cobalt px-4 text-[14px] font-semibold text-paper hover:bg-cobalt/90">
          {t(locale, "chrome.notFoundBack")}
        </Link>
      </div>
    </div>
  );
}
