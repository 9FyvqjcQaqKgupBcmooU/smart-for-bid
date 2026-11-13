"use client";

import { useEffect } from "react";
import { RoleSwitcher } from "./RoleSwitcher";
import { PrefsMenu } from "./PrefsMenu";
import { NotificationBell } from "./NotificationBell";
import { t, type Locale } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import type { User, Vendor, Notification } from "@prisma/client";
import { isDemo } from "@/lib/demo";

const RFQ_ROLES = new Set(["BUYER", "VALIDATOR", "OPENING_A", "OPENING_B", "VENDOR"]);

export function TopBar({
  current,
  users,
  locale,
  theme,
  onMenu,
  notifications = [],
}: {
  current: User & { vendor: Vendor | null };
  users: (User & { vendor: Vendor | null })[];
  locale: Locale;
  theme: ThemePreference;
  onMenu?: () => void;
  notifications?: Notification[];
}) {
  let rfqUsers = users.filter((u) => RFQ_ROLES.has(u.role));
  if (!rfqUsers.some((u) => u.id === current.id)) {
    rfqUsers = [current, ...rfqUsers];
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const el = document.getElementById("shell-search") as HTMLInputElement | null;
        if (el) {
          e.preventDefault();
          el.focus();
          el.select();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line/80 bg-paper px-3 text-ink md:gap-3 md:px-6">
      {onMenu ? (
        <button
          type="button"
          onClick={onMenu}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-line text-[14px] font-semibold text-ink md:hidden"
          aria-label={t(locale, "shell.menu")}
        >
          ☰
        </button>
      ) : null}
      <form action="/" method="get" className="min-w-0 flex-1 md:max-w-md">
        <label className="flex h-10 items-center gap-2 rounded-xl border border-line bg-paper-2 px-3.5 text-[13px] text-ink/70">
          <span aria-hidden>⌕</span>
          <input
            id="shell-search"
            name="q"
            type="search"
            placeholder={t(locale, "shell.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-soft focus:outline-none"
          />
          <kbd className="hidden rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] text-ink/70 sm:inline">⌘K</kbd>
        </label>
      </form>
      <div className="ml-auto flex min-w-0 items-center gap-1.5 text-ink md:gap-2">
        <NotificationBell items={notifications} locale={locale} />
        <PrefsMenu locale={locale} theme={theme} demo={isDemo()} />
        <RoleSwitcher users={rfqUsers} currentId={current.id} locale={locale} />
      </div>
    </header>
  );
}
