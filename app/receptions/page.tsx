import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusPill } from "@/components/StatusPill";
import { Money } from "@/components/Money";
import { Workbench, EmptyPane, ListToolbar } from "@/components/chrome";
import { GRPane } from "@/components/panes/GRPane";
import { formatDateTime, cn } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function ReceptionsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const locale = await getLocale();
  const { current } = await requireUser();
  const rows = await prisma.goodsReceipt.findMany({
    where:
      current.role === "VENDOR" && current.vendorId
        ? { po: { vendorId: current.vendorId } }
        : undefined,
    include: { po: { include: { vendor: true, requisition: true } }, receivedBy: true, accruals: true },
    orderBy: { receivedAt: "desc" },
  });
  const selected = rows.find((g) => g.id === id) ?? rows[0];

  return (
    <Workbench
      leftClassName="w-[272px]"
      toolbar={
        <ListToolbar
          title={t(locale, "lists.grs")}
          action={
            <Link href="/receptions/nouvelle" className="text-[13px] text-ink-soft hover:text-ink">
              {t(locale, "lists.newReceipt")}
            </Link>
          }
        />
      }
      left={
        rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px] text-ink-soft">{t(locale, "lists.noGR")}</p>
        ) : (
          <ul>
            {rows.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/receptions?id=${g.id}`}
                  className={cn(
                    "flex items-start justify-between gap-3 border-b border-line px-3 py-2.5 hover:bg-paper-2/70",
                    selected?.id === g.id && "bg-paper-2"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">{g.po.requisition.title}</span>
                    <span className="mt-0.5 block text-[13px] text-ink-soft">
                      {g.number} · {g.po.vendor.name} · <StatusPill status={g.type} locale={locale} />
                    </span>
                  </span>
                  <span className="shrink-0 tabular text-[14px] font-medium">
                    <Money value={g.accruals.reduce((s, a) => s + a.amount, 0)} locale={locale} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      }
      right={selected ? <GRPane id={selected.id} /> : <EmptyPane title={t(locale, "lists.emptyGR")} />}
    />
  );
}
