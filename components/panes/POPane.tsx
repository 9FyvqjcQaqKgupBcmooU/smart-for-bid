import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Money } from "@/components/Money";
import { formatDateTime } from "@/lib/format";
import { cancelPO } from "@/app/actions/orders";
import { confirmReceipt } from "@/app/actions/receipts";
import { arriveInvoice } from "@/app/actions/invoices";
import { Decision, btnGhost, btnPrimary, UpNext, FileLink } from "@/components/chrome";
import { Explain } from "@/components/Explain";
import { trailFromPO, formatCostLine } from "@/lib/costs";
import { requireUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { PIPELINE_INDEX } from "@/lib/s2p";

export async function POPane({ id }: { id: string }) {
  const locale = await getLocale();
  const { current } = await requireUser();
  const p = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      issuedBy: true,
      requisition: true,
      lines: true,
      receipts: { include: { lines: true, accruals: true } },
      invoices: { include: { lines: true } },
    },
  });
  if (!p) notFound();
  const cost = trailFromPO(p, { locale });
  const canReceive = p.status === "issued" || p.status === "partially_received";
  const hasReceipt = p.receipts.length > 0;
  const hasInvoice = p.invoices.length > 0;
  const awaitInvoice = hasReceipt && !hasInvoice;
  const showReceivePrimary = canReceive && !hasReceipt;
  const total = p.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const thisInvoice = p.invoices[0];
  const upNext = showReceivePrimary ? (
    <UpNext locale={locale} label={t(locale, "next.invoiceArrived")} />
  ) : awaitInvoice ? (
    <UpNext locale={locale} label={t(locale, "next.acceptExtra")} />
  ) : thisInvoice && thisInvoice.status !== "paid" ? (
    <UpNext
      locale={locale}
      href={`/factures?id=${thisInvoice.id}`}
      label={t(locale, thisInvoice.status === "approved" ? "next.payThis" : "next.acceptExtra")}
    />
  ) : null;

  const question = showReceivePrimary
    ? t(locale, "inbox.qReceive")
    : awaitInvoice
      ? t(locale, "inbox.qInvoice")
      : p.requisition.title;

  return (
    <Decision
      locale={locale}
      pipelineIndex={PIPELINE_INDEX.po}
      question={question}
      title={p.requisition.title}
      subtitle={`${p.number} · ${p.vendor.name}`}
      people={[{ name: p.issuedBy.name, hint: t(locale, "roles.full.BUYER") }]}
      amount={total}
      amountCaption={
        <Explain tip={t(locale, "learn.po")}>{t(locale, "caption.orderedBeforeTax")}</Explain>
      }
      context={`${t(locale, "po.issuedBy", { date: formatDateTime(p.issuedAt, locale), name: p.issuedBy.name })} · ${t(locale, "po.terms", { terms: p.terms })}`}
      costLine={formatCostLine(cost, locale) || undefined}
      upNext={upNext}
      actions={
        <>
          {awaitInvoice && (
            <form action={arriveInvoice}>
              <input type="hidden" name="poId" value={p.id} />
              <button className={btnPrimary()}>{t(locale, "actions.invoiceArrived")}</button>
            </form>
          )}
          {showReceivePrimary && (
            <button form="gr-form" className={btnPrimary()}>
              {t(locale, "actions.confirmReceipt")}
            </button>
          )}
          {canReceive && hasReceipt && (
            <button form="gr-form" className={btnGhost()}>
              {t(locale, "actions.confirmReceipt")}
            </button>
          )}
          {p.status === "issued" && current.role === "BUYER" && (
            <form action={cancelPO}>
              <input type="hidden" name="id" value={p.id} />
              <button className={btnGhost()}>{t(locale, "actions.cancel")}</button>
            </form>
          )}
        </>
      }
      rail={
        <>
          <FileLink href={`/demandes?id=${p.requisition.id}`} label={p.requisition.number} hint={t(locale, "steps.requisition")} />
          {p.receipts.map((g) => (
            <FileLink key={g.id} href={`/receptions?id=${g.id}`} label={g.number} hint={t(locale, "steps.receiving")} />
          ))}
          {p.invoices.map((i) => (
            <FileLink key={i.id} href={`/factures?id=${i.id}`} label={i.number} hint={t(locale, "steps.invoice")} />
          ))}
        </>
      }
    >
      {canReceive ? (
        <form id="gr-form" action={confirmReceipt}>
          <input type="hidden" name="poId" value={p.id} />
          <input type="hidden" name="type" value="GOODS" />
          <table className="w-full text-[13px]">
            <thead className="text-left text-ink-soft">
              <tr>
                <th className="py-2 pr-3 font-normal">{t(locale, "po.designation")}</th>
                <th className="py-2 pr-3 font-normal">{t(locale, "po.qty")}</th>
                <th className="py-2 pr-3 font-normal">{t(locale, "gr.received")}</th>
                <th className="py-2 pr-3 font-normal">{t(locale, "po.unitPrice")}</th>
                <th className="py-2 text-right font-normal">{t(locale, "po.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {p.lines.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="py-2.5">{l.description}</td>
                  <td className="py-2.5 tabular">
                    {l.qty} {l.unit}
                  </td>
                  <td className="py-2.5">
                    <input
                      name={`qty_${l.id}`}
                      defaultValue={l.qty}
                      className="h-8 w-20 rounded-md border border-line bg-paper px-2 tabular"
                    />
                  </td>
                  <td className="py-2.5 tabular">
                    <Money value={l.unitPrice} locale={locale} />
                  </td>
                  <td className="py-2.5 text-right tabular">
                    <Money value={l.qty * l.unitPrice} locale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>
      ) : (
        <table className="w-full text-[13px]">
          <thead className="text-left text-ink-soft">
            <tr>
              <th className="py-2 pr-3 font-normal">{t(locale, "po.designation")}</th>
              <th className="py-2 pr-3 font-normal">{t(locale, "po.qty")}</th>
              <th className="py-2 pr-3 font-normal">{t(locale, "po.unitPrice")}</th>
              <th className="py-2 text-right font-normal">{t(locale, "po.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {p.lines.map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className="py-2.5">{l.description}</td>
                <td className="py-2.5 tabular">
                  {l.qty} {l.unit}
                </td>
                <td className="py-2.5 tabular">
                  <Money value={l.unitPrice} locale={locale} />
                </td>
                <td className="py-2.5 text-right tabular">
                  <Money value={l.qty * l.unitPrice} locale={locale} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Decision>
  );
}
