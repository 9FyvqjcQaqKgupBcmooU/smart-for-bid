import Link from "next/link";
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
}: {
  current: User & { vendor: Vendor | null };
  users: (User & { vendor: Vendor | null })[];
  locale: Locale;
  theme: ThemePreference;
}) {
  let rfqUsers = users.filter((u) => RFQ_ROLES.has(u.role));
  if (!rfqUsers.some((u) => u.id === current.id)) {
    rfqUsers = [current, ...rfqUsers];
  }
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line/70 bg-paper px-4 text-ink md:gap-4 md:px-6">
      <Link href="/" className="shrink-0 text-[17px] font-semibold tracking-tight text-ink">
        {t(locale, "product.name")}
      </Link>
      <div className="ml-auto flex min-w-0 items-center gap-1.5 text-ink-soft md:gap-2">
        <PrefsMenu locale={locale} theme={theme} demo={isDemo()} />
        <RoleSwitcher users={rfqUsers} currentId={current.id} locale={locale} />
      </div>
    </header>
  );
}
