import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusPill } from "@/components/StatusPill";
import { Money } from "@/components/Money";
import { formatDate, formatEUR, cn } from "@/lib/format";
import { approveInvoice, rejectInvoice, rematchInvoice } from "@/app/actions/invoices";
import { decideStep } from "@/app/actions/requisitions";
import { Decision, TaxLine, btnGhost, btnPrimary, UpNext, FileLink } from "@/components/chrome";
import { Explain } from "@/components/Explain";
import { PayPane } from "./PayPane";
import { matchInvoice, trailFromPO, formatCostLine } from "@/lib/costs";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { PIPELINE_INDEX } from "@/lib/s2p";

export async function FAPane({ id }: { id: string }) {
  const locale = await getLocale();
  const { current } = await requireUser();
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      vendor: true,
      glAccount: true,
      createdBy: true,
      lines: true,
      steps: { include: { approver: true }, orderBy: { stepOrder: "asc" } },
      po: {
        include: {
          vendor: true,
          lines: true,
          receipts: { include: { lines: true } },
          requisition: true,
          invoices: { include: { lines: true } },
        },
      },
    },
  });
  if (!inv) notFound();
  if (inv.status === "approved") {
    return <PayPane id={id} />;
  }

  const { match, explanation } = matchInvoice(inv, inv.po, locale);
  const cost = inv.po
    ? trailFromPO({ ...inv.po, invoices: [inv] }, { locale })
    : {
        planned: null,
        plannedLabel: "planned",
        ordered: 0,
        received: 0,
        invoiced: inv.amountHT,
        delta: 0,
        deltaReason: null,
        extras: [] as { label: string; amount: number }[],
        ttc: inv.amountTTC,
        vat: inv.vatAmount,
        vatRate: inv.vatRate,
        wht: inv.whtAmount,
      };
  if (explanation.reason && !cost.deltaReason) cost.deltaReason = explanation.reason;
  if (explanation.extras.length && cost.extras.length === 0) cost.extras = explanation.extras;
  cost.ttc = inv.amountTTC;
  cost.vat = inv.vatAmount;
  cost.vatRate = inv.vatRate;
  cost.wht = inv.whtAmount;

  const pending = inv.steps.find((s) => s.status === "pending");
  const visa = pending && pending.approverId === current.id ? pending : null;
  const canApproveMatch = (inv.status === "matched" || inv.status === "extracted") && current.role === "AP";
  const extraAmt = match && !match.matched ? Math.max(0, match.varianceEUR) : 0;
  const mismatch = inv.status === "mismatch" || (match && !match.matched);

  const question = mismatch
    ? t(locale, "inbox.qMismatch")
    : inv.status === "approved"
      ? t(locale, "inbox.qPay", { vendor: inv.vendor.name })
      : t(locale, "inbox.qReview");

  const title = inv.po?.requisition?.title ?? inv.vendor.name;
  const costLine = formatCostLine(cost, locale);

  const table = match ? (
    <div>
    <p className="mb-2 text-[13px] leading-[18px] text-ink-soft">{t(locale, "learn.match")}</p>
    <table className="w-full text-[15px]">
      <thead className="text-left text-[13px] text-ink-soft">
        <tr>
          <th className="py-1 pr-3">{t(locale, "fa.field")}</th>
          <th className="pr-3">{t(locale, "fa.poCol")}</th>
          <th className="pr-3">{t(locale, "fa.gr")}</th>
          <th className="pr-3">{t(locale, "fa.inv")}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {match.fields.map((f) => (
          <tr key={f.key} className={cn("border-t border-line", !f.ok && "text-danger")}>
            <td className="py-1.5 pr-3">{t(locale, `match.${f.key}`) === `match.${f.key}` ? f.label : t(locale, `match.${f.key}`)}</td>
            <td className="tabular pr-3">{f.po}</td>
            <td className="tabular pr-3">{f.receipt}</td>
            <td className="tabular pr-3">{f.invoice}</td>
            <td className="text-[13px]">{f.ok ? t(locale, "fa.ok") : t(locale, "fa.gap")}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  ) : null;

  const actions = (
    <>
      {visa && (
        <>
          <button form="ecart-form" name="decision" value="approve" className={btnPrimary()}>
            {extraAmt
              ? t(locale, "actions.acceptExtra", { amount: formatEUR(extraAmt, locale) })
              : t(locale, "actions.acceptVariance")}
          </button>
          <button form="ecart-form" name="decision" value="reject" className={btnGhost()}>
            {t(locale, "actions.sendBack")}
          </button>
        </>
      )}
      {canApproveMatch && (
        <form action={approveInvoice}>
          <input type="hidden" name="id" value={inv.id} />
          <button className={btnPrimary()}>{t(locale, "actions.approve")}</button>
        </form>
      )}
      <form action={rematchInvoice}>
        <input type="hidden" name="id" value={inv.id} />
        <button className={btnGhost()}>{t(locale, "actions.rematch")}</button>
      </form>
      {inv.status !== "paid" && inv.status !== "rejected" && current.role === "AP" ? (
        <form action={rejectInvoice}>
          <input type="hidden" name="id" value={inv.id} />
          <button className={btnGhost()}>{t(locale, "actions.rejectInvoice")}</button>
        </form>
      ) : null}
    </>
  );

  return (
    <Decision
      locale={locale}
      pipelineIndex={PIPELINE_INDEX.fa}
      question={question}
      title={`${title} · ${inv.vendor.name}`}
      subtitle={`${inv.number} · ${formatDate(inv.invoiceDate, locale)} · ${t(locale, "fa.due")} ${formatDate(inv.dueDate, locale)}${inv.glAccount ? ` · ${inv.glAccount.code}` : ""}`}
      people={inv.steps.map((st) => ({
        name: st.approver.name,
        hint: st.level,
        active: st.status === "pending" && st.approverId === current.id,
      }))}
      amount={inv.amountHT}
      amountCaption={
        <Explain tip={t(locale, locale === "fr" ? "learn.ht" : "learn.exclTax")}>
          {t(locale, "caption.beforeTax")}
        </Explain>
      }
      amountHint={
        <TaxLine locale={locale} lead="ht" ttc={inv.amountTTC} vatRate={inv.vatRate} wht={inv.whtAmount} />
      }
      context={mismatch ? t(locale, "inbox.billedMore") : undefined}
      costLine={costLine || undefined}
      extra={
        visa ? (
          <form id="ecart-form" action={decideStep}>
            <input type="hidden" name="stepId" value={visa.id} />
            <input
              name="comment"
              placeholder={t(locale, "fa.justification")}
              className="h-9 w-full max-w-md rounded-md border border-line bg-paper px-3 text-[15px]"
            />
          </form>
        ) : null
      }
      upNext={
        inv.status !== "paid" ? <UpNext locale={locale} label={t(locale, "next.payThis")} /> : null
      }
      actions={actions}
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
          {inv.po?.receipts?.map((g) => (
            <FileLink key={g.id} href={`/receptions?id=${g.id}`} label={g.number} hint={t(locale, "steps.receiving")} />
          ))}
        </>
      }
    >
      {table}
      <table className="mt-4 w-full text-[13px]">
        <thead className="text-left text-ink-soft">
          <tr>
            <th className="py-2 pr-3 font-normal">{t(locale, "fa.line")}</th>
            <th className="py-2 pr-3 font-normal">{t(locale, "fa.qty")}</th>
            <th className="py-2 pr-3 font-normal">{t(locale, "fa.pu")}</th>
            <th className="py-2 text-right font-normal">{t(locale, "fa.amount")}</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l) => (
            <tr key={l.id} className="border-t border-line">
              <td className="py-2.5">{l.description}</td>
              <td className="py-2.5 tabular">{l.qty}</td>
              <td className="py-2.5 tabular">
                <Money value={l.unitPrice} locale={locale} />
              </td>
              <td className="py-2.5 text-right tabular">
                <Money value={l.amount} locale={locale} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Decision>
  );
}
