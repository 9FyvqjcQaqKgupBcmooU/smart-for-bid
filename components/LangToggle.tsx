"use client";

import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/format";

export function LangToggle({ locale }: { locale: Locale }) {
  return (
    <form action={setLocale} className="inline-flex rounded-full bg-paper-2 p-1 text-[16px]">
      <button
        name="locale"
        value="en"
        className={cn(
          "inline-flex min-h-11 items-center rounded-full px-3.5",
          locale === "en" ? "bg-paper font-medium text-ink shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-ink-soft hover:text-ink"
        )}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        name="locale"
        value="fr"
        className={cn(
          "inline-flex min-h-11 items-center rounded-full px-3.5",
          locale === "fr" ? "bg-paper font-medium text-ink shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-ink-soft hover:text-ink"
        )}
        aria-pressed={locale === "fr"}
      >
        FR
      </button>
    </form>
  );
}
