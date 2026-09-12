import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/roles";
import { formatEUR } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { isDemo } from "@/lib/demo";
import { ResetDemoButton } from "@/components/ResetDemoButton";

export default async function ParametresPage() {
  const locale = await getLocale();
  const [thresholds, accounts, users, vendors] = await Promise.all([
    prisma.approvalThreshold.findMany({ orderBy: { minAmount: "asc" } }),
    prisma.chartOfAccount.findMany({ orderBy: { code: "asc" } }),
    prisma.user.findMany({ include: { vendor: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="h-full overflow-y-auto px-6 py-4">
      <p className="mb-3 text-[13px] text-ink-soft">{t(locale, "settings.title")}</p>
      {isDemo() && (
        <section className="paper-card mb-4 max-w-5xl rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.resetDemo")}</h2>
          <p className="mt-1.5 text-[13px] leading-[18px] text-ink-soft">{t(locale, "settings.resetDemoHint")}</p>
          <div className="mt-3">
            <ResetDemoButton locale={locale} />
          </div>
        </section>
      )}
      <div className="grid max-w-5xl grid-cols-2 gap-4">
        <section className="paper-card rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.thresholds")}</h2>
          <table className="mt-2 w-full text-[12px]">
            <tbody>
              {thresholds.map((th) => (
                <tr key={th.id} className="border-t border-line">
                  <td className="py-1">
                    {th.label}
                    <div className="text-[10px] text-ink-soft">
                      {formatEUR(th.minAmount, locale)} → {th.maxAmount === null ? "∞" : formatEUR(th.maxAmount, locale)}
                    </div>
                  </td>
                  <td className="tabular">{(JSON.parse(th.levels) as string[]).join(" → ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="paper-card rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.pcg")}</h2>
          <table className="mt-2 w-full text-[12px]">
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="w-16 py-1 tabular font-medium">{a.code}</td>
                  <td>{a.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="paper-card rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.users")}</h2>
          <table className="mt-2 w-full text-[12px]">
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-1 font-medium">{u.name}</td>
                  <td>{u.role === "VENDOR" ? u.vendor?.name : roleLabel(locale, u.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="paper-card rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.vendors")}</h2>
          <table className="mt-2 w-full text-[12px]">
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-t border-line">
                  <td className="py-1 font-medium">{v.name}</td>
                  <td>{v.city}</td>
                  <td>{v.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
