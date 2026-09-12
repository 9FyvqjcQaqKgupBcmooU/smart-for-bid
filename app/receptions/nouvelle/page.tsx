import { prisma } from "@/lib/prisma";
import { confirmReceipt } from "@/app/actions/receipts";
import { Money } from "@/components/Money";
import { btnPrimary } from "@/components/chrome";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function NewReceipt({ searchParams }: { searchParams: Promise<{ po?: string }> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const pos = await prisma.purchaseOrder.findMany({
    where: { status: { in: ["issued", "partially_received"] } },
    include: { vendor: true, lines: true },
    orderBy: { issuedAt: "desc" },
  });
  const selected = pos.find((p) => p.id === sp.po) ?? pos[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 shrink-0 items-center border-b border-line px-4">
        <p className="text-[13px] text-ink-soft">{t(locale, "gr.newReceipt")}</p>
      </div>
      {pos.length === 0 ? (
        <p className="p-4 text-sm text-ink-soft">{t(locale, "gr.noOpenPO")}</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <form className="flex items-center gap-2 border-b border-line px-4 py-2 text-[12px]">
            <select name="po" defaultValue={selected?.id} className="rounded-md border border-line bg-paper px-2 py-1">
              {pos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number} — {p.vendor.name}
                </option>
              ))}
            </select>
            <button className="text-ink underline-offset-2 hover:underline">{t(locale, "chrome.show")}</button>
          </form>
          <form action={confirmReceipt} className="flex min-h-0 flex-1 flex-col">
            <input type="hidden" name="poId" value={selected.id} />
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="mx-auto max-w-xl space-y-3">
                <label className="block text-[12px]">
                  {t(locale, "gr.nature")}
                  <select name="type" className="mt-0.5 w-full rounded-md border border-line bg-paper px-2 py-1.5">
                    <option value="GOODS">{t(locale, "gr.goods")}</option>
                    <option value="SERVICE">{t(locale, "gr.service")}</option>
                  </select>
                </label>
                {selected.lines.map((l) => (
                  <div key={l.id} className="grid grid-cols-12 items-center gap-2 text-[12px]">
                    <div className="col-span-7">
                      {l.description}
                      <div className="text-[10px] text-ink-soft">
                        {t(locale, "gr.orderedLine", { qty: l.qty, unit: l.unit })}
                        <Money value={l.unitPrice} locale={locale} />
                      </div>
                    </div>
                    <input
                      name={`qty_${l.id}`}
                      defaultValue={l.qty}
                      className="col-span-3 rounded-md border border-line bg-paper px-2 py-1 tabular"
                    />
                    <span className="col-span-2 text-ink-soft">{l.unit}</span>
                  </div>
                ))}
                <textarea name="notes" rows={2} placeholder={t(locale, "gr.notesPlaceholder")} className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-[12px]" />
              </div>
            </div>
            <div className="flex shrink-0 justify-end border-t border-line px-4 py-2">
              <button className={btnPrimary()}>{t(locale, "actions.confirmOpen408")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
