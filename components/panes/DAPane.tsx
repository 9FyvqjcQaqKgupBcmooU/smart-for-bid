import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, firstName } from "@/lib/format";
import { decideStep, submitRequisition } from "@/app/actions/requisitions";
import { issuePO } from "@/app/actions/orders";
import { Decision, btnGhost, btnPrimary, FileLink } from "@/components/chrome";
import { Explain } from "@/components/Explain";
import { trailFromPO, trail, formatCostLine } from "@/lib/costs";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { PIPELINE_INDEX } from "@/lib/s2p";

export async function DAPane({ id }: { id: string }) {
  const locale = await getLocale();
  const { current } = await requireUser();
  const r = await prisma.requisition.findUnique({
    where: { id },
    include: {
      requester: true,
      tender: true,
      steps: { include: { approver: true }, orderBy: { stepOrder: "asc" } },
      purchaseOrders: {
        include: {
          vendor: true,
          lines: true,
          receipts: { include: { lines: true } },
          invoices: { include: { lines: true } },
        },
      },
    },
  });
  if (!r) notFound();
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
  const pending = r.steps.find((s) => s.status === "pending");
  const visa = pending && pending.approverId === current.id ? pending : null;
  const noPO = r.purchaseOrders.length === 0;
  const needsSourcing = r.type === "ONE_OFF" && !r.tenderId && noPO;
  const skipSourcing = r.type === "RECURRING" && noPO;
  const canIssue = r.status === "approved" && current.role === "BUYER" && noPO;
  const canLaunchAO =
    needsSourcing &&
    (r.status === "approved" || r.status === "pending") &&
    (current.role === "BUYER" || current.role === "N4" || current.role === "REQUESTER");

  const poTrail = r.purchaseOrders[0]
    ? trailFromPO({ ...r.purchaseOrders[0], requisition: r }, { locale })
    : trail({ planned: r.amountHT, plannedLabel: "planned", ordered: 0, received: 0, invoiced: 0 });

  const approved = r.steps.filter((s) => s.status === "approved");
  const names = approved.map((s) => firstName(s.approver.name)).join(", ");

  let question = r.title;
  let context: string | undefined;
  if (visa) {
    question = t(locale, "inbox.qApprove");
    context = names
      ? t(locale, "inbox.alreadyApproved", { names })
      : t(locale, "inbox.askedBy", { name: firstName(r.requester.name) });
  } else if (r.status === "draft") {
    question = t(locale, "inbox.qSubmit");
    context = t(locale, "da.draftNotSubmitted");
  } else if (canLaunchAO) {
    question = t(locale, "inbox.qSource");
    context = t(locale, "da.oneOffSourceFirst");
  } else if (skipSourcing && canIssue) {
    question = t(locale, "inbox.qIssue");
    context = t(locale, "da.recurringSkip");
  } else if (canIssue) {
    question = t(locale, "inbox.qIssue");
  }

  const actions = (
    <>
      {visa && (
        <>
          <button form="visa-form" name="decision" value="approve" className={btnPrimary()}>
            {t(locale, "actions.approve")}
          </button>
          <button form="visa-form" name="decision" value="reject" className={btnGhost()}>
            {t(locale, "actions.sendBack")}
          </button>
        </>
      )}
      {r.status === "draft" && (current.id === r.requesterId || current.role === "BUYER") && (
        <button form="submit-form" className={btnPrimary()}>
          {t(locale, "actions.submitForApproval")}
        </button>
      )}
      {canLaunchAO && (
        <Link href={`/appels-offres/nouveau?da=${r.id}`} className={btnPrimary()}>
          {t(locale, "actions.launchRFQ")}
        </Link>
      )}
      {canIssue && (
        <button form="po-form" className={btnPrimary()}>
          {t(locale, "actions.issuePO")}
        </button>
      )}
    </>
  );

  return (
    <Decision
      locale={locale}
      pipelineIndex={PIPELINE_INDEX.da}
      question={question}
      title={r.title}
      subtitle={`${r.number} · ${r.requester.name} · ${r.costCenter} · ${t(locale, "da.needed")} ${formatDate(r.neededBy, locale)}`}
      amount={r.amountHT}
      amountCaption={
        <Explain tip={t(locale, locale === "fr" ? "learn.ht" : "learn.exclTax")}>
          {t(locale, "caption.askedBeforeTax")}
        </Explain>
      }
      context={context}
      costLine={r.purchaseOrders[0] ? formatCostLine(poTrail, locale) || undefined : undefined}
      extra={
        <>
          {visa && (
            <form id="visa-form" action={decideStep}>
              <input type="hidden" name="stepId" value={visa.id} />
              <input
                name="comment"
                placeholder={t(locale, "chrome.optionalNote")}
                className="h-9 w-full max-w-md rounded-md border border-line bg-paper px-3 text-[15px]"
              />
            </form>
          )}
          {r.status === "draft" && (current.id === r.requesterId || current.role === "BUYER") && (
            <form id="submit-form" action={submitRequisition}>
              <input type="hidden" name="id" value={r.id} />
            </form>
          )}
          {canIssue && (
            <form id="po-form" action={issuePO} className="max-w-md space-y-2">
              <input type="hidden" name="requisitionId" value={r.id} />
              <label className="block text-[13px] text-ink-soft">
                {t(locale, "da.vendor")}
                <select name="vendorId" className="mt-1 h-9 w-full rounded-md border border-line bg-paper px-3 text-[15px] text-ink">
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <input type="hidden" name="terms" defaultValue={t(locale, "da.defaultTerms")} />
              <input type="hidden" name="lineDesc" defaultValue={r.title} />
              <input type="hidden" name="lineQty" defaultValue="1" />
              <input type="hidden" name="lineUnit" defaultValue="lump" />
              <input type="hidden" name="linePrice" defaultValue={String(r.amountHT)} />
            </form>
          )}
        </>
      }
      actions={actions}
      rail={
        r.tender || r.purchaseOrders.length ? (
          <>
            {r.tender ? (
              <FileLink href={`/appels-offres?id=${r.tender.id}`} label={r.tender.number} hint={t(locale, "steps.rfq")} />
            ) : null}
            {r.purchaseOrders.map((p) => (
              <FileLink key={p.id} href={`/commandes?id=${p.id}`} label={p.number} hint={p.vendor.name} />
            ))}
          </>
        ) : undefined
      }
    >
      {r.description ? (
        <p className="mb-4 whitespace-pre-wrap text-[13px] leading-[18px] text-ink">{r.description}</p>
      ) : null}
      <table className="w-full text-[13px]">
        <thead className="text-left text-ink-soft">
          <tr>
            <th className="py-2 pr-3 font-normal">{t(locale, "chrome.people")}</th>
            <th className="py-2 pr-3 font-normal">{t(locale, "da.circuit")}</th>
            <th className="py-2 font-normal" />
          </tr>
        </thead>
        <tbody>
          {r.steps.length === 0 ? (
            <tr className="border-t border-line">
              <td className="py-2.5 text-ink-soft" colSpan={3}>
                {t(locale, "da.notSubmitted")}
              </td>
            </tr>
          ) : null}
          {r.steps.map((st) => (
            <tr key={st.id} className="border-t border-line">
              <td className="py-2.5 font-medium">{st.approver.name}</td>
              <td className="py-2.5 text-ink-soft">{st.level}</td>
              <td className="py-2.5">
                <StatusPill status={st.status} locale={locale} />
                {st.comment ? <span className="ml-2 text-ink-soft">{st.comment}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Decision>
  );
}
