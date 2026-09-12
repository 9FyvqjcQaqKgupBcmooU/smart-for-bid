import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusPill } from "@/components/StatusPill";
import { Money } from "@/components/Money";
import { Workbench, EmptyPane, ListToolbar } from "@/components/chrome";
import { POPane } from "@/components/panes/POPane";
import { formatDate, cn } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function CommandesPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const locale = await getLocale();
  const { current } = await requireUser();
  const rows = await prisma.purchaseOrder.findMany({
    where: current.role === "VENDOR" && current.vendorId ? { vendorId: current.vendorId } : undefined,
    include: { vendor: true, lines: true, requisition: true },
    orderBy: { issuedAt: "desc" },
  });
  const selected = rows.find((p) => p.id === id) ?? rows[0];

  return (
    <Workbench
      leftClassName="w-[272px]"
      toolbar={<ListToolbar title={t(locale, "lists.pos")} />}
      left={
        rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px] text-ink-soft">{t(locale, "lists.noPO")}</p>
        ) : (
          <ul>
            {rows.map((p) => {
              const amt = p.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
              return (
                <li key={p.id}>
                  <Link
                    href={`/commandes?id=${p.id}`}
                    className={cn(
                      "flex items-start justify-between gap-3 border-b border-line px-3 py-2.5 hover:bg-paper-2/70",
                      selected?.id === p.id && "bg-paper-2"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{p.requisition.title}</span>
                      <span className="mt-0.5 block text-[13px] text-ink-soft">
                        {p.number} · {p.vendor.name} · <StatusPill status={p.status} locale={locale} />
                      </span>
                    </span>
                    <span className="shrink-0 tabular text-[14px] font-medium">
                      <Money value={amt} locale={locale} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      }
      right={selected ? <POPane id={selected.id} /> : <EmptyPane title={t(locale, "lists.emptyPO")} />}
    />
  );
}
