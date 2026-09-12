"use client";

import { resetDemoData } from "@/app/actions/demo";
import { t, type Locale } from "@/lib/i18n";
import { btnPrimary } from "@/components/chrome";

export function ResetDemoButton({
  locale,
  variant = "primary",
}: {
  locale: Locale;
  variant?: "primary" | "menu";
}) {
  return (
    <form
      action={resetDemoData}
      onSubmit={(e) => {
        if (!confirm(t(locale, "settings.resetDemoConfirm"))) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className={variant === "menu" ? "inline-flex min-h-11 items-center text-left text-[16px] text-ink-soft hover:text-ink" : btnPrimary()}
      >
        {t(locale, variant === "menu" ? "chrome.resetDemo" : "settings.resetDemo")}
      </button>
    </form>
  );
}
