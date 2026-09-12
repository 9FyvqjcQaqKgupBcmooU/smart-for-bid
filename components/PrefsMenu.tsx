"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";
import { t, type Locale } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import { ResetDemoButton } from "./ResetDemoButton";

export function PrefsMenu({
  locale,
  theme,
  demo = false,
}: {
  locale: Locale;
  theme: ThemePreference;
  demo?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 min-w-11 items-center rounded-full px-3.5 text-[14px] text-ink-soft hover:bg-paper-2 hover:text-ink"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {t(locale, "chrome.prefs")}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 max-w-[min(100vw-1.5rem,18rem)] min-w-[200px] rounded-2xl border border-line/80 bg-paper p-3 shadow-[0_8px_28px_rgba(15,23,42,0.12)]">
          <div className="py-2">
            <p className="mb-1.5 text-[12px] text-ink-soft">{t(locale, "chrome.language")}</p>
            <LangToggle locale={locale} />
          </div>
          <div className="py-2">
            <p className="mb-1.5 text-[12px] text-ink-soft">{t(locale, "chrome.theme")}</p>
            <ThemeToggle theme={theme} locale={locale} />
          </div>
          <div className="py-2">
            <Link
              href="/parametres"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 min-w-11 items-center rounded-full px-3 text-[14px] text-ink-soft hover:bg-paper-2 hover:text-ink"
            >
              {t(locale, "chrome.settings")}
            </Link>
          </div>
          {demo && (
            <div className="border-t border-line py-2">
              <ResetDemoButton locale={locale} variant="menu" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
