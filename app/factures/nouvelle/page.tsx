import { prisma } from "@/lib/prisma";
import { InvoiceExtractForm } from "@/components/InvoiceExtractForm";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function NewInvoice() {
  const locale = await getLocale();
  const [vendors, pos, accounts] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.purchaseOrder.findMany({ orderBy: { issuedAt: "desc" }, select: { id: true, number: true, vendorId: true } }),
    prisma.chartOfAccount.findMany({ orderBy: { code: "asc" } }),
  ]);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-11 shrink-0 items-center border-b border-line px-4">
        <p className="text-[13px] text-ink-soft">{t(locale, "fa.newInvoice")}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <InvoiceExtractForm vendors={vendors} pos={pos} accounts={accounts} locale={locale} />
        </div>
      </div>
    </div>
  );
}
