"use client";

import { RoleSwitcher } from "./RoleSwitcher";
import { PrefsMenu } from "./PrefsMenu";
import { t, type Locale } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import type { User, Vendor } from "@prisma/client";
import { isDemo } from "@/lib/demo";

const RFQ_ROLES = new Set(["BUYER", "OPENING_A", "OPENING_B", "VENDOR"]);

export function TopBar({
  current,
  users,
  locale,
  theme,
  onMenu,
}: {
  current: User & { vendor: Vendor | null };
  users: (User & { vendor: Vendor | null })[];
  locale: Locale;
  theme: ThemePreference;
  onMenu?: () => void;
}) {
  let rfqUsers = users.filter((u) => RFQ_ROLES.has(u.role));
  if (!rfqUsers.some((u) => u.id === current.id)) {
    rfqUsers = [current, ...rfqUsers];
  }
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-paper px-3 text-ink md:gap-3 md:px-5">
      {onMenu ? (
        <button
          type="button"
          onClick={onMenu}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-line text-[14px] font-semibold text-ink md:hidden"
          aria-label={t(locale, "shell.menu")}
        >
          ☰
        </button>
      ) : null}
      <form action="/" method="get" className="hidden min-w-0 flex-1 md:block md:max-w-md">
        <label className="flex h-9 items-center gap-2 rounded-full border border-line bg-paper-2 px-3.5 text-[13px] text-ink/70">
          <span aria-hidden>⌕</span>
          <input
            name="q"
            type="search"
            placeholder={t(locale, "shell.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink/50 focus:outline-none"
          />
          <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink/60">⌘K</kbd>
        </label>
      </form>
      <div className="ml-auto flex min-w-0 items-center gap-1.5 text-ink md:gap-2">
        <PrefsMenu locale={locale} theme={theme} demo={isDemo()} />
        <RoleSwitcher users={rfqUsers} currentId={current.id} locale={locale} />
      </div>
    </header>
  );
}
