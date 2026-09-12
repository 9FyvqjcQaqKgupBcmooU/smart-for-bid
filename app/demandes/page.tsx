import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusPill } from "@/components/StatusPill";
import { Money } from "@/components/Money";
import { Workbench, EmptyPane, ListToolbar, btnPrimary } from "@/components/chrome";
import { DAPane } from "@/components/panes/DAPane";
import { decideStep } from "@/app/actions/requisitions";
import { cn } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function DemandesPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const locale = await getLocale();
  const { current } = await requireUser();
  const rows = await prisma.requisition.findMany({
    include: {
      requester: true,
      tender: true,
      steps: { where: { status: "pending" }, include: { approver: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const selected = rows.find((r) => r.id === id) ?? rows[0];
  const canCreate = current.role === "REQUESTER" || current.role === "BUYER";

  return (
    <Workbench
      leftClassName="w-[272px]"
      toolbar={
        <ListToolbar
          title={t(locale, "lists.prs")}
          action={
            canCreate ? (
              <Link href="/demandes/nouvelle" className={btnPrimary()}>
                {t(locale, "lists.newPR")}
              </Link>
            ) : undefined
          }
        />
      }
      left={
        rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px] text-ink-soft">{t(locale, "lists.noPR")}</p>
        ) : (
          <ul>
            {rows.map((r) => {
              const pending = r.steps[0];
              const canAct = pending && pending.approverId === current.id;
              return (
                <li key={r.id}>
                  <Link
                    href={`/demandes?id=${r.id}`}
                    className={cn(
                      "flex items-start justify-between gap-3 border-b border-line px-3 py-2.5 hover:bg-paper-2/70",
                      selected?.id === r.id && "bg-paper-2"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{r.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-soft">
                        <span>{r.number}</span>
                        <StatusPill status={r.status} locale={locale} />
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block tabular text-[14px] font-medium">
                        <Money value={r.amountHT} locale={locale} />
                      </span>
                      {canAct && (
                        <form action={decideStep} className="mt-1">
                          <input type="hidden" name="stepId" value={pending.id} />
                          <button name="decision" value="approve" className="text-[13px] text-ink-soft hover:text-ink">
                            {t(locale, "actions.approve")}
                          </button>
                        </form>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      }
      right={selected ? <DAPane id={selected.id} /> : <EmptyPane title={t(locale, "lists.emptyPR")} />}
    />
  );
}
