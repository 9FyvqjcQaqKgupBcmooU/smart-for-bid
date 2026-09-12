import { prisma } from "@/lib/prisma";
import { createTender } from "@/app/actions/tenders";
import { btnPrimary } from "@/components/chrome";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function NewTender() {
  const locale = await getLocale();
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
  const deadline = new Date(Date.now() + 7 * 86400000);
  const local = new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const briefing = t(locale, "ao.defaultBriefing");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 shrink-0 items-center border-b border-line px-4">
        <p className="text-[13px] text-ink-soft">{t(locale, "ao.newFrom", { from: "" })}</p>
      </div>
      <form action={createTender} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3">
            <label className="col-span-2 text-[12px]">
              {t(locale, "ao.title")}
              <input name="title" required className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5" />
            </label>
            <label className="text-[12px]">
              {t(locale, "ao.deadlineLabel")}
              <input name="deadline" type="datetime-local" required defaultValue={local} className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5" />
            </label>
            <fieldset className="text-[12px]">
              <legend>{t(locale, "ao.invitedVendors")}</legend>
              <div className="mt-1 max-h-24 space-y-0.5 overflow-y-auto">
                {vendors.map((v) => (
                  <label key={v.id} className="flex items-center gap-2">
                    <input type="checkbox" name="vendorId" value={v.id} defaultChecked />
                    {v.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="col-span-2 text-[12px]">
              {t(locale, "ao.briefingLabel")}
              <textarea name="briefing" required rows={6} defaultValue={briefing} className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5 font-mono text-[12px]" />
            </label>
          </div>
        </div>
        <div className="flex shrink-0 justify-end border-t border-line px-4 py-2">
          <button className={btnPrimary()}>{t(locale, "actions.saveDraft")}</button>
        </div>
      </form>
    </div>
  );
}
