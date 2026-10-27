import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TopBar } from "./TopBar";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { getThemePreference } from "@/lib/theme";
import Link from "next/link";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = await getThemePreference();
  const ctx = await getCurrentUser();
  if (!ctx) {
    return (
      <div className="flex h-full min-h-dvh flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line/70 bg-paper px-4 md:px-6">
          <Link href="/sign-in" className="text-[17px] font-semibold tracking-tight text-ink">
            {t(locale, "product.name")}
          </Link>
          <div className="ml-auto flex gap-3 text-sm">
            <Link href="/sign-in" className="text-cobalt hover:underline">
              {t(locale, "auth.signIn")}
            </Link>
            <Link href="/sign-up" className="text-cobalt hover:underline">
              {t(locale, "auth.signUp")}
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }
  const { current, users } = ctx;
  const company =
    current.companyId
      ? await prisma.company.findFirst({ where: { id: current.companyId } })
      : await prisma.company.findFirst();
  return (
    <div className="flex min-h-dvh flex-col md:h-full md:overflow-hidden">
      <TopBar current={current} users={users} locale={locale} theme={theme} />
      {!company && (
        <div className="border-b border-line/70 bg-cobalt-soft px-4 py-2 text-sm text-ink">
          {t(locale, "auth.noOrgHint")}
        </div>
      )}
      <main className="md:min-h-0 md:flex-1 md:overflow-hidden">{children}</main>
    </div>
  );
}
