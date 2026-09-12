"use client";

import { setTheme } from "@/app/actions/theme";
import { cn } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";

const OPTIONS = [
  { value: "light", key: "chrome.themeLight" },
  { value: "dark", key: "chrome.themeDark" },
  { value: "system", key: "chrome.themeSystem" },
] as const;

export function ThemeToggle({
  theme,
  locale,
}: {
  theme: "light" | "dark" | "system";
  locale: Locale;
}) {
  return (
    <form action={setTheme} className="inline-flex flex-wrap rounded-full bg-paper-2 p-1 text-[16px]">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          name="theme"
          value={opt.value}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-3.5",
            theme === opt.value ? "bg-paper font-medium text-ink shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-ink-soft hover:text-ink"
          )}
          aria-pressed={theme === opt.value}
        >
          {t(locale, opt.key)}
        </button>
      ))}
    </form>
  );
}
