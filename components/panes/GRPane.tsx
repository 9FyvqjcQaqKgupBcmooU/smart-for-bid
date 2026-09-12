import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusPill } from "@/components/StatusPill";
import { Money } from "@/components/Money";
import { formatDateTime, formatEUR } from "@/lib/format";
import { Decision, btnPrimary, UpNext, FileLink } from "@/components/chrome";
import { arriveInvoice } from "@/app/actions/invoices";
import { Explain } from "@/components/Explain";
import { trailFromPO, formatCostLine } from "@/lib/costs";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { PIPELINE_INDEX } from "@/lib/s2p";

export async function GRPane({ id }: { id: string }) {
  const locale = await getLocale();
  const g = await prisma.goodsReceipt.findUnique({
    where: { id },
    include: {
      receivedBy: true,
      accruals: true,
      lines: true,
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
  if (!g) notFound();
  const cost = trailFromPO(g.po, { locale });
  const amount = g.lines.reduce((s, l) => s + l.qtyReceived * l.unitPrice, 0);
  const openHold = g.accruals.some((a) => a.status === "open");
  const holdAmt = g.accruals.filter((a) => a.status === "open").reduce((s, a) => s + a.amount, 0);
  const thisInvoice = g.po.invoices[0];
  const upNext = !thisInvoice ? (
    <UpNext locale={locale} label={t(locale, "next.acceptExtra")} />
  ) : thisInvoice.status !== "paid" ? (
    <UpNext
      locale={locale}
      href={`/factures?id=${thisInvoice.id}`}
      label={t(locale, thisInvoice.status === "approved" ? "next.payThis" : "next.acceptExtra")}
    />
  ) : null;
  return (
    <Decision
      locale={locale}
      pipelineIndex={PIPELINE_INDEX.gr}
      question={g.po.invoices.length === 0 ? t(locale, "inbox.qInvoice") : t(locale, "gr.receiptOf", { number: g.po.number })}
      title={g.po.requisition.title}
      subtitle={`${g.number} · ${g.po.vendor.name}`}
      people={[{ name: g.receivedBy.name, hint: t(locale, "steps.receiving") }]}
      amount={amount}
      amountCaption={
        <Explain tip={t(locale, locale === "fr" ? "learn.ht" : "learn.exclTax")}>
          {t(locale, "caption.arrivedBeforeTax")}
        </Explain>
      }
      amountHint={
        openHold ? (
          <>
            {formatEUR(holdAmt || amount, locale)}{" "}
            <Explain tip={t(locale, "learn.accrual")}>{t(locale, "caption.setAside")}</Explain>
            {" — "}
            {t(locale, "cost.goodsReceivedNoInvoice")}
          </>
        ) : undefined
      }
      context={`${g.receivedBy.name} · ${formatDateTime(g.receivedAt, locale)}`}
      costLine={openHold ? undefined : formatCostLine(cost, locale) || undefined}
      upNext={upNext}
      actions={
        <>
          {g.po.invoices.length === 0 && (
            <form action={arriveInvoice}>
              <input type="hidden" name="poId" value={g.poId} />
              <button className={btnPrimary()}>{t(locale, "actions.invoiceArrived")}</button>
            </form>
          )}
          <Link href={`/commandes?id=${g.poId}`} className="text-[15px] text-ink-soft underline hover:text-ink">
            {t(locale, "gr.viewPO", { number: g.po.number })}
          </Link>
        </>
      }
      rail={
        <>
          <FileLink href={`/commandes?id=${g.poId}`} label={g.po.number} hint={t(locale, "steps.po")} />
          {g.po.requisition ? (
            <FileLink href={`/demandes?id=${g.po.requisition.id}`} label={g.po.requisition.number} hint={t(locale, "steps.requisition")} />
          ) : null}
          {g.po.invoices.map((i) => (
            <FileLink key={i.id} href={`/factures?id=${i.id}`} label={i.number} hint={t(locale, "steps.invoice")} />
          ))}
        </>
      }
    >
      <table className="w-full text-[13px]">
        <thead className="text-left text-[13px] text-ink-soft">
          <tr>
            <th className="py-1">{t(locale, "gr.line")}</th>
            <th>{t(locale, "gr.ordered")}</th>
            <th>{t(locale, "gr.received")}</th>
            <th>{t(locale, "gr.variance")}</th>
            <th>{t(locale, "gr.amount")}</th>
          </tr>
        </thead>
        <tbody>
          {g.lines.map((l) => {
            const gap = l.qtyReceived - l.qtyOrdered;
            return (
              <tr key={l.id} className="border-t border-line">
                <td className="py-1.5">{l.description}</td>
                <td className="tabular">{l.qtyOrdered}</td>
                <td className="tabular">{l.qtyReceived}</td>
                <td className={gap < 0 ? "tabular text-danger" : "tabular"}>{gap}</td>
                <td className="tabular">
                  <Money value={l.qtyReceived * l.unitPrice} locale={locale} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {g.notes && <p className="mt-3">{g.notes}</p>}
      <div className="mt-3">
        {g.accruals.map((a) => (
          <p key={a.id} className="text-ink-soft">
            <Money value={a.amount} locale={locale} />{" "}
            <Explain tip={t(locale, "learn.accrual")}>{t(locale, "caption.setAside")}</Explain>
            {" — "}
            {t(locale, "cost.goodsReceivedNoInvoice")}
            {" · "}
            <StatusPill status={a.status} locale={locale} />
          </p>
        ))}
      </div>
    </Decision>
  );
}
