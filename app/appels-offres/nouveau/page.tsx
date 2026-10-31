import { prisma } from "@/lib/prisma";
import { createTender } from "@/app/actions/tenders";
import { btnPrimary } from "@/components/chrome";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { BriefEditor } from "@/components/BriefEditor";
import { ConditionsEditor } from "@/components/ConditionsEditor";
import { parseConditions, DEMO_NON_NEGOTIABLES } from "@/lib/conditions";

export default async function NewTender() {
  const locale = await getLocale();
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
  const company = await prisma.company.findFirst();
  const deadline = new Date(Date.now() + 7 * 86400000);
  const local = new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const briefing = t(locale, "ao.defaultBriefing");
  const defaults = company ? parseConditions(company.nonNegotiables) : [...DEMO_NON_NEGOTIABLES];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-11 shrink-0 items-center border-b border-line px-4 py-2">
        <p className="text-[14px] text-ink-soft">{t(locale, "ao.newFrom", { from: "" })}</p>
      </div>
      <form action={createTender} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="col-span-full text-[14px]">
              {t(locale, "ao.title")}
              <input name="title" required className="mt-0.5 min-h-10 w-full rounded-md border border-line bg-paper px-3 py-2 text-[14px]" />
            </label>
            <label className="text-[14px]">
              {t(locale, "ao.deadlineLabel")}
              <input name="deadline" type="datetime-local" required defaultValue={local} className="mt-0.5 min-h-10 w-full rounded-md border border-line bg-paper px-3 py-2 text-[14px]" />
            </label>
            <fieldset className="text-[14px]">
              <legend>{t(locale, "ao.invitedVendors")}</legend>
              <div className="mt-1 max-h-28 space-y-1 overflow-y-auto">
                {vendors.map((v) => (
                  <label key={v.id} className="flex min-h-10 items-center gap-2">
                    <input type="checkbox" name="vendorId" value={v.id} defaultChecked className="h-5 w-5" />
                    {v.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="col-span-full text-[14px]">
              <p className="mb-1 font-medium">{t(locale, "ao.briefingLabel")}</p>
              <BriefEditor name="briefing" defaultValue={briefing} required rows={8} />
            </div>
            <div className="col-span-full text-[14px]">
              <p className="mb-1 font-medium">{t(locale, "ao.nonNegotiables")}</p>
              <p className="mb-2 text-[13px] text-ink-soft">{t(locale, "ao.nonNegotiablesHint")}</p>
              <ConditionsEditor name="nonNegotiables" defaultItems={defaults} />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 justify-end border-t border-line px-4 py-2">
          <button className={btnPrimary() + " min-h-10"}>{t(locale, "actions.saveDraft")}</button>
        </div>
      </form>
    </div>
  );
}
