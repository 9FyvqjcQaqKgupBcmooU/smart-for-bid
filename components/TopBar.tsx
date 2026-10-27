"use client";

import Link from "next/link";
import { RoleSwitcher } from "./RoleSwitcher";
import { PrefsMenu } from "./PrefsMenu";
import { t, type Locale } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import type { User, Vendor } from "@prisma/client";
import { SealMark } from "./SealMark";

const RFQ_ROLES = new Set(["BUYER", "OPENING_A", "OPENING_B", "VENDOR"]);

export function TopBar({
  current,
  users,
  locale,
  theme,
  demo = false,
  onMenu,
}: {
  current: User & { vendor: Vendor | null };
  users: (User & { vendor: Vendor | null })[];
  locale: Locale;
  theme: ThemePreference;
  demo?: boolean;
  onMenu?: () => void;
}) {
  let rfqUsers = users.filter((u) => RFQ_ROLES.has(u.role));
  if (!rfqUsers.some((u) => u.id === current.id)) {
    rfqUsers = [current, ...rfqUsers];
  }
  const isSupplier = current.role === "VENDOR";
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line/80 bg-paper px-3 text-ink md:h-14 md:gap-3 md:px-5">
      <button
        type="button"
        onClick={onMenu}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-ink-soft hover:bg-paper-2 md:hidden"
        aria-label={t(locale, "shell.menu")}
      >
        <span className="text-[18px]" aria-hidden>
          ☰
        </span>
      </button>

      <Link
        href="/"
        className="inline-flex min-h-10 shrink-0 items-center gap-2 text-[15px] font-semibold tracking-tight text-ink md:hidden"
      >
        <SealMark size={18} />
        {t(locale, "product.name")}
      </Link>

      <form action="/" method="get" className="ml-auto hidden min-w-0 max-w-md flex-1 md:ml-0 md:flex">
        <label className="sr-only" htmlFor="shell-search">
          {t(locale, "shell.searchPlaceholder")}
        </label>
        <input
          id="shell-search"
          name="q"
          type="search"
          placeholder={t(locale, "shell.searchPlaceholder")}
          className="min-h-9 w-full rounded-full border border-line/80 bg-paper-2 px-3.5 text-[13px] text-ink placeholder:text-ink-soft transition-colors focus:border-cobalt focus:bg-paper focus:outline-none"
        />
      </form>

      <div className="ml-auto flex min-w-0 items-center gap-1 text-ink-soft md:ml-0 md:gap-1.5">
        <span className="hidden truncate text-[12px] text-ink-soft lg:inline">
          {isSupplier ? t(locale, "roles.short.VENDOR") : t(locale, "roles.short.BUYER")}
        </span>
        <PrefsMenu locale={locale} theme={theme} demo={demo} />
        <RoleSwitcher users={rfqUsers} currentId={current.id} locale={locale} />
      </div>
    </header>
  );
}
