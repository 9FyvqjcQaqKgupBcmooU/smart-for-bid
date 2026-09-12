import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TopBar } from "./TopBar";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { getThemePreference } from "@/lib/theme";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = await getThemePreference();
  const ctx = await getCurrentUser();
  if (!ctx) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="paper-card max-w-lg p-8">
          <p className="text-[28px] font-medium">{t(locale, "product.name")}</p>
          <p className="mt-3 text-sm text-ink-soft">{t(locale, "chrome.emptyDb")}</p>
        </div>
      </div>
    );
  }
  const { current, users } = ctx;
  const company = await prisma.company.findFirst({ where: { id: current.companyId } });
  return (
    <div className="flex min-h-dvh flex-col md:h-full md:overflow-hidden">
      {company && <TopBar current={current} users={users} locale={locale} theme={theme} />}
      <main className="md:min-h-0 md:flex-1 md:overflow-hidden">{children}</main>
    </div>
  );
}
