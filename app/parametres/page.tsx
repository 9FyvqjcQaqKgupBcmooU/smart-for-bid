import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/roles";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { isDemo } from "@/lib/demo";
import { ResetDemoButton } from "@/components/ResetDemoButton";
import { ConditionsEditor } from "@/components/ConditionsEditor";
import { updateOrgNonNegotiables } from "@/app/actions/tenders";
import { parseConditions, DEMO_NON_NEGOTIABLES } from "@/lib/conditions";
import { btnPrimary } from "@/components/chrome";

const BID_ROLES = new Set(["BUYER", "VALIDATOR", "OPENING_A", "OPENING_B", "VENDOR"]);

export default async function ParametresPage() {
  const locale = await getLocale();
  const company = await prisma.company.findFirst();
  const [users, vendors] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: [...BID_ROLES] } },
      include: { vendor: true },
      orderBy: { name: "asc" },
    }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="h-full overflow-x-hidden overflow-y-auto px-5 py-5 md:px-7">
      <h1 className="mb-5 text-[22px] font-semibold tracking-tight text-ink">{t(locale, "settings.title")}</h1>

      <section className="paper-card mb-4 max-w-5xl rounded-2xl p-5" data-testid="non-negotiables-settings">
        <h2 className="text-[14px] font-semibold text-ink">Non-negotiable conditions</h2>
        <p className="mt-1 text-[13px] leading-5 text-ink-soft">
          Default list for every new Decathlon RFQ. Untick to drop from the defaults; the buyer can still adjust per RFQ.
        </p>
        <form action={updateOrgNonNegotiables} className="mt-3 space-y-2">
          <ConditionsEditor
            name="nonNegotiables"
            defaultItems={company ? parseConditions(company.nonNegotiables) : [...DEMO_NON_NEGOTIABLES]}
          />
          <button className={btnPrimary() + " min-h-10 text-[13px]"}>Save conditions</button>
        </form>
      </section>

      {isDemo() && (
        <section className="paper-card mb-4 max-w-5xl rounded-2xl p-5">
          <h2 className="text-[14px] font-semibold text-ink">{t(locale, "settings.resetDemo")}</h2>
          <p className="mt-1 text-[13px] leading-5 text-ink-soft">{t(locale, "settings.resetDemoHint")}</p>
          <div className="mt-3">
            <ResetDemoButton locale={locale} />
          </div>
        </section>
      )}

      <div className="grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="paper-card rounded-2xl p-5">
          <h2 className="text-[14px] font-semibold text-ink">People</h2>
          <p className="mt-0.5 text-[12px] text-ink-soft">Buyer, approver, opening officers and supplier contacts.</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-0 text-[13px]">
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-line">
                    <td className="py-2 pr-3 font-medium text-ink">{u.name}</td>
                    <td className="py-2 text-ink-soft">
                      {u.role === "VENDOR" ? u.vendor?.name ?? "Supplier" : roleLabel(locale, u.role)}
                    </td>
                    <td className="py-2 text-ink-soft">{u.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="paper-card rounded-2xl p-5">
          <h2 className="text-[14px] font-semibold text-ink">Suppliers</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-0 text-[13px]">
              <thead>
                <tr className="text-left text-[12px] text-ink-soft">
                  <th className="py-1.5 font-medium">Company</th>
                  <th className="py-1.5 font-medium">Contact</th>
                  <th className="py-1.5 font-medium">City</th>
                  <th className="py-1.5 font-medium">Category</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => {
                  const contact = users.find((u) => u.vendor?.id === v.id);
                  return (
                    <tr key={v.id} className="border-t border-line">
                      <td className="py-2 pr-3 font-medium text-ink">{v.name}</td>
                      <td className="py-2 text-ink">{contact?.name ?? "—"}</td>
                      <td className="py-2 text-ink-soft">{v.city}</td>
                      <td className="py-2 text-ink-soft">{v.category}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
