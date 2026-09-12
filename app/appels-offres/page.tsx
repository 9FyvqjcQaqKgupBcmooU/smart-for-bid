import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusPill } from "@/components/StatusPill";
import { Workbench, EmptyPane, ListToolbar } from "@/components/chrome";
import { AOPane } from "@/components/panes/AOPane";
import { formatDateTime, daysUntil, cn } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { FEATURED_RFQ_NUMBER } from "@/lib/demo";

export default async function TendersPage({ searchParams }: { searchParams: Promise<{ id?: string; tab?: string }> }) {
  const { id, tab } = await searchParams;
  const locale = await getLocale();
  const { current } = await requireUser();
  const tenders = await prisma.tender.findMany({
    include: { createdBy: true, invites: true, bids: true },
    orderBy: { number: "asc" },
  });
  const visible =
    current.role === "VENDOR" && current.vendorId
      ? tenders.filter((x) => x.invites.some((i) => i.vendorId === current.vendorId))
      : tenders;
  visible.sort((a, b) => {
    const fa = a.number === FEATURED_RFQ_NUMBER ? 0 : 1;
    const fb = b.number === FEATURED_RFQ_NUMBER ? 0 : 1;
    if (fa !== fb) return fa - fb;
    return a.number.localeCompare(b.number);
  });
  const selected =
    (id ? visible.find((x) => x.id === id) : undefined) ??
    visible.find((x) => x.number === FEATURED_RFQ_NUMBER) ??
    visible[0];
  const canCreate = current.role === "BUYER" || current.role === "N4";

  return (
    <Workbench
      leftClassName="w-[272px]"
      toolbar={
        <ListToolbar
          title={t(locale, "lists.rfqs")}
          action={
            canCreate ? (
              <Link href="/appels-offres/nouveau" className="text-[13px] text-ink-soft hover:text-ink">
                {t(locale, "lists.newRFQ")}
              </Link>
            ) : undefined
          }
        />
      }
      left={
        visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px] text-ink-soft">{t(locale, "lists.noRFQ")}</p>
        ) : (
          <ul>
            {visible.map((row) => {
              const d = daysUntil(row.deadline);
              return (
                <li key={row.id}>
                  <Link
                    href={`/appels-offres?id=${row.id}`}
                    className={cn(
                      "block border-b border-line px-3 py-2.5 hover:bg-paper-2/70",
                      selected?.id === row.id && "bg-paper-2"
                    )}
                  >
                    <span className="block truncate text-[14px] font-medium">{row.title}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-soft">
                      <span>{row.number}</span>
                      <StatusPill status={row.status} locale={locale} />
                      <span>
                        {d >= 0 ? t(locale, "lists.daysLeft", { n: d }) : t(locale, "lists.expired", { n: -d })}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[13px] text-ink-soft">
                      {row.bids.length}/{row.invites.length} · {formatDateTime(row.deadline, locale)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      }
      right={selected ? <AOPane id={selected.id} tab={tab} /> : <EmptyPane title={t(locale, "lists.emptyRFQ")} />}
    />
  );
}
