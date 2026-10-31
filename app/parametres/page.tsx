import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/roles";
import { formatEUR } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { isDemo } from "@/lib/demo";
import { ResetDemoButton } from "@/components/ResetDemoButton";
import { ConditionsEditor } from "@/components/ConditionsEditor";
import { updateOrgNonNegotiables } from "@/app/actions/tenders";
import { parseConditions, DEMO_NON_NEGOTIABLES } from "@/lib/conditions";
import { btnPrimary } from "@/components/chrome";

export default async function ParametresPage() {
  const locale = await getLocale();
  const company = await prisma.company.findFirst();
  const [thresholds, accounts, users, vendors] = await Promise.all([
    prisma.approvalThreshold.findMany({ orderBy: { minAmount: "asc" } }),
    prisma.chartOfAccount.findMany({ orderBy: { code: "asc" } }),
    prisma.user.findMany({ include: { vendor: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="h-full overflow-x-hidden overflow-y-auto px-3 py-4 md:px-6">
      <p className="mb-3 text-[13px] text-ink-soft">{t(locale, "settings.title")}</p>
      
      <section className="paper-card mb-4 max-w-5xl rounded-md p-3">
        <h2 className="text-[14px] font-semibold">Conditions non négociables (organisation)</h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          Liste par défaut pour tout nouvel appel d&apos;offres Decathlon. L&apos;acheteuse peut l&apos;ajuster par AO.
        </p>
        <form action={updateOrgNonNegotiables} className="mt-3 space-y-3">
          <ConditionsEditor
            name="nonNegotiables"
            defaultItems={company ? parseConditions(company.nonNegotiables) : [...DEMO_NON_NEGOTIABLES]}
          />
          <button className={btnPrimary() + " min-h-10"}>Enregistrer les conditions</button>
        </form>
      </section>

      {isDemo() && (
        <section className="paper-card mb-4 max-w-5xl rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.resetDemo")}</h2>
          <p className="mt-1.5 text-[13px] leading-[18px] text-ink-soft">{t(locale, "settings.resetDemoHint")}</p>
          <div className="mt-3">
            <ResetDemoButton locale={locale} />
          </div>
        </section>
      )}
      <div className="grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="paper-card rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.thresholds")}</h2>
          <div className="mt-2 overflow-x-auto"><table className="w-full min-w-0 text-[12px]">
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
          </table></div>
        </section>
        <section className="paper-card rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.pcg")}</h2>
          <div className="mt-2 overflow-x-auto"><table className="w-full min-w-0 text-[12px]">
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="w-16 py-1 tabular font-medium">{a.code}</td>
                  <td>{a.label}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
        <section className="paper-card rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.users")}</h2>
          <div className="mt-2 overflow-x-auto"><table className="w-full min-w-0 text-[12px]">
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-1 font-medium">{u.name}</td>
                  <td>{u.role === "VENDOR" ? u.vendor?.name : roleLabel(locale, u.role)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
        <section className="paper-card rounded-md p-3">
          <h2 className="text-[12px] font-semibold">{t(locale, "settings.vendors")}</h2>
          <div className="mt-2 overflow-x-auto"><table className="w-full min-w-0 text-[12px]">
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-t border-line">
                  <td className="py-1 font-medium">{v.name}</td>
                  <td>{v.city}</td>
                  <td>{v.category}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
}
