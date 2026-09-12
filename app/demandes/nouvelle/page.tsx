import { createRequisition } from "@/app/actions/requisitions";
import { btnPrimary } from "@/components/chrome";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function NewDA() {
  const locale = await getLocale();
  const needed = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 shrink-0 items-center border-b border-line px-4">
        <p className="text-[13px] text-ink-soft">{t(locale, "da.newPR")}</p>
      </div>
      <form action={createRequisition} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
            <label className="col-span-2 text-[12px]">
              {t(locale, "da.title")}
              <input name="title" required className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5" />
            </label>
            <label className="text-[12px]">
              {t(locale, "da.type")}
              <select name="type" className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5">
                <option value="ONE_OFF">{t(locale, "da.typeOneOff")}</option>
                <option value="RECURRING">{t(locale, "da.typeRecurring")}</option>
              </select>
            </label>
            <label className="text-[12px]">
              {t(locale, "da.amountHT")}
              <input name="amountHT" required className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5 tabular" />
            </label>
            <label className="text-[12px]">
              {t(locale, "da.costCenter")}
              <input name="costCenter" required defaultValue="MAG-LIL-05" className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5" />
            </label>
            <label className="text-[12px]">
              {t(locale, "da.neededBy")}
              <input name="neededBy" type="date" required defaultValue={needed} className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5" />
            </label>
            <label className="col-span-2 text-[12px]">
              {t(locale, "da.description")}
              <textarea name="description" rows={2} className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5" />
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
