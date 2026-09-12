import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Money } from "@/components/Money";
import { formatDate } from "@/lib/format";
import { runPayment } from "@/app/actions/payments";
import { Decision, TaxLine, btnPrimary, FileLink } from "@/components/chrome";
import { Explain } from "@/components/Explain";
import { trailFromPO, formatCostLine } from "@/lib/costs";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { PIPELINE_INDEX } from "@/lib/s2p";

export async function PayPane({ id }: { id: string }) {
  const locale = await getLocale();
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      vendor: true,
      po: {
        include: {
          vendor: true,
          lines: true,
          receipts: { include: { lines: true } },
          invoices: { include: { lines: true } },
          requisition: true,
        },
      },
    },
  });
  if (!inv) notFound();
  if (inv.status !== "approved") {
    redirect(`/factures?id=${id}`);
  }
  const cost = inv.po
    ? trailFromPO({ ...inv.po, invoices: [inv] }, { locale })
    : {
        planned: inv.amountHT,
        plannedLabel: "planned",
        ordered: 0,
        received: 0,
        invoiced: inv.amountHT,
        delta: 0,
        deltaReason: null as string | null,
        extras: [] as { label: string; amount: number }[],
        ttc: inv.amountTTC,
        vat: inv.vatAmount,
        vatRate: inv.vatRate,
        wht: inv.whtAmount,
      };
  cost.ttc = inv.amountTTC;
  cost.vat = inv.vatAmount;
  cost.vatRate = inv.vatRate;
  cost.wht = inv.whtAmount;

  return (
    <Decision
      locale={locale}
      pipelineIndex={PIPELINE_INDEX.pay}
      question={t(locale, "inbox.qPay", { vendor: inv.vendor.name })}
      title={inv.po?.requisition?.title ?? inv.vendor.name}
      subtitle={`${inv.number} · ${inv.vendor.name}`}
      amount={inv.amountTTC}
      amountCaption={
        <Explain tip={t(locale, "learn.inclTax")}>{t(locale, "caption.toPayIncl")}</Explain>
      }
      amountHint={
        <TaxLine locale={locale} lead="ttc" ht={inv.amountHT} vatRate={inv.vatRate} wht={inv.whtAmount} />
      }
      context={`${t(locale, "pay.due", { date: formatDate(inv.dueDate, locale) })}${t(locale, "pay.oneClick")}`}
      costLine={formatCostLine(cost, locale) || undefined}
      extra={
        <form id="pay-one" action={runPayment}>
          <input type="hidden" name="invoiceId" value={inv.id} />
          <label className="text-[13px] text-ink-soft">
            {t(locale, "pay.valueDate")}
            <input
              name="paymentDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="ml-2 h-9 rounded-md border border-line bg-paper px-3 text-[15px]"
            />
          </label>
        </form>
      }
      actions={
        <button form="pay-one" className={btnPrimary()}>
          {t(locale, "actions.pay")}
        </button>
      }
      rail={
        <>
          {inv.po ? (
            <FileLink href={`/commandes?id=${inv.po.id}`} label={inv.po.number} hint={t(locale, "steps.po")} />
          ) : null}
          {inv.po?.requisition ? (
            <FileLink
              href={`/demandes?id=${inv.po.requisition.id}`}
              label={inv.po.requisition.number}
              hint={t(locale, "steps.requisition")}
            />
          ) : null}
        </>
      }
    >
      <table className="w-full text-[13px]">
        <thead className="text-left text-ink-soft">
          <tr>
            <th className="py-2 pr-3 font-normal">{t(locale, "fa.line")}</th>
            <th className="py-2 text-right font-normal">{t(locale, "fa.amount")}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-line">
            <td className="py-2.5">{inv.vendor.name}</td>
            <td className="py-2.5 text-right tabular">
              <Money value={inv.amountTTC} locale={locale} />
            </td>
          </tr>
        </tbody>
      </table>
    </Decision>
  );
}
