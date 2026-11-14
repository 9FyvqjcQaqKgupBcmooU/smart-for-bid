"use client";

import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/format";

export function LangToggle({ locale }: { locale: Locale }) {
  return (
    <form action={setLocale} className="inline-flex rounded-xl bg-paper-2 p-1 text-[13px]">
      <button
        name="locale"
        value="en"
        className={cn(
          "inline-flex min-h-9 items-center rounded-lg px-3",
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
          "inline-flex min-h-9 items-center rounded-lg px-3",
          locale === "fr" ? "bg-paper font-medium text-ink shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-ink-soft hover:text-ink"
        )}
        aria-pressed={locale === "fr"}
      >
        FR
      </button>
    </form>
  );
}
