import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusPill } from "@/components/StatusPill";
import { Money } from "@/components/Money";
import { formatDate, cn } from "@/lib/format";
import { runPayment } from "@/app/actions/payments";
import { Workbench, EmptyPane, ListToolbar, btnPrimary, Decision } from "@/components/chrome";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function PaiementsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireUser();
  const locale = await getLocale();
  const { id } = await searchParams;
  const payable = await prisma.invoice.findMany({
    where: { status: "approved" },
    include: { vendor: true, po: { include: { requisition: true } } },
    orderBy: { dueDate: "asc" },
  });
  const runs = await prisma.payment.findMany({
    include: { executedBy: true, items: { include: { invoice: true } } },
    orderBy: { createdAt: "desc" },
  });
  const selected = payable.find((i) => i.id === id) ?? payable[0];
  const total = payable.reduce((s, i) => s + i.amountTTC, 0);

  return (
    <Workbench
      leftClassName="w-[272px]"
      toolbar={<ListToolbar title={t(locale, "lists.payments")} />}
      left={
        <>
          <p className="border-b border-line px-3 py-2.5 text-[13px] text-ink-soft">
            {t(locale, "lists.queue", { n: payable.length })}
            <Money value={total} locale={locale} />
          </p>
          {payable.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-ink-soft">{t(locale, "lists.nothingToPay")}</p>
          ) : (
            <ul>
              {payable.map((i) => (
                <li key={i.id}>
                  <a
                    href={`/paiements?id=${i.id}`}
                    className={cn(
                      "flex items-start justify-between gap-3 border-b border-line px-3 py-2.5 hover:bg-paper-2/70",
                      selected?.id === i.id && "bg-paper-2"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{i.vendor.name}</span>
                      <span className="mt-0.5 block text-[13px] text-ink-soft">
                        {i.number} · {formatDate(i.dueDate, locale)}
                      </span>
                    </span>
                    <span className="tabular text-[14px] font-medium">
                      <Money value={i.amountTTC} locale={locale} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {runs.length > 0 && (
            <div className="border-t border-line px-3 py-2.5">
              <p className="text-[13px] text-ink-soft">{t(locale, "lists.history")}</p>
              {runs.map((r) => (
                <p key={r.id} className="mt-1 text-[13px]">
                  {r.runNumber} · <StatusPill status={r.status} locale={locale} /> ·{" "}
                  <Money value={r.items.reduce((s, i) => s + i.amount, 0)} locale={locale} />
                </p>
              ))}
            </div>
          )}
        </>
      }
      right={
        payable.length === 0 ? (
          <EmptyPane title={t(locale, "lists.emptyPay")} />
        ) : (
          <form action={runPayment} className="flex h-full min-h-0 flex-col">
            <Decision
              locale={locale}
              question={selected ? t(locale, "inbox.qPay", { vendor: selected.vendor.name }) : t(locale, "pay.runTitle")}
              title={t(locale, "pay.runTitle")}
              amount={total}
              context={t(locale, "pay.oneClick")}
              extra={
                <label className="text-[13px] text-ink-soft">
                  {t(locale, "pay.valueDate")}
                  <input
                    name="paymentDate"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="ml-2 h-9 rounded-md border border-line bg-paper px-3 text-[15px]"
                  />
                </label>
              }
              actions={
                <button disabled={payable.length === 0} className={btnPrimary()}>
                  {t(locale, "actions.pay")}
                </button>
              }
              below={
              <table className="w-full">
                <thead className="text-left text-[13px] text-ink-soft">
                  <tr>
                    <th className="py-1"></th>
                    <th>{t(locale, "pay.invoice")}</th>
                    <th>{t(locale, "pay.vendor")}</th>
                    <th>{t(locale, "pay.gross")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payable.map((i) => (
                    <tr key={i.id} className="border-t border-line">
                      <td className="py-1.5">
                        <input type="checkbox" name="invoiceId" value={i.id} defaultChecked={selected ? i.id === selected.id : true} />
                      </td>
                      <td className="tabular">{i.number}</td>
                      <td>{i.vendor.name}</td>
                      <td className="tabular">
                        <Money value={i.amountTTC} locale={locale} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              }
            />
          </form>
        )
      }
    />
  );
}
