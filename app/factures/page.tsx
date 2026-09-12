import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusPill } from "@/components/StatusPill";
import { Money } from "@/components/Money";
import { Workbench, EmptyPane, ListToolbar } from "@/components/chrome";
import { FAPane } from "@/components/panes/FAPane";
import { formatDate, cn } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function FacturesPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const locale = await getLocale();
  const { current } = await requireUser();
  const rows = await prisma.invoice.findMany({
    where: current.role === "VENDOR" && current.vendorId ? { vendorId: current.vendorId } : undefined,
    include: { vendor: true, po: { include: { requisition: true } }, glAccount: true },
    orderBy: { createdAt: "desc" },
  });
  const selected = rows.find((i) => i.id === id) ?? rows[0];

  return (
    <Workbench
      leftClassName="w-[272px]"
      toolbar={
        <ListToolbar
          title={t(locale, "lists.invoices")}
          action={
            current.role !== "VENDOR" ? (
              <Link href="/factures/nouvelle" className="text-[13px] text-ink-soft hover:text-ink">
                {t(locale, "lists.captureExtract")}
              </Link>
            ) : undefined
          }
        />
      }
      left={
        rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px] text-ink-soft">{t(locale, "lists.noInvoice")}</p>
        ) : (
          <ul>
            {rows.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/factures?id=${i.id}`}
                  className={cn(
                    "flex items-start justify-between gap-3 border-b border-line px-3 py-2.5 hover:bg-paper-2/70",
                    selected?.id === i.id && "bg-paper-2"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">
                      {i.po?.requisition?.title ?? i.vendor.name}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-ink-soft">
                      {i.number} · {i.vendor.name} · <StatusPill status={i.status} locale={locale} />
                    </span>
                  </span>
                  <span className="shrink-0 tabular text-[14px] font-medium">
                    <Money value={i.amountHT} locale={locale} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      }
      right={selected ? <FAPane id={selected.id} /> : <EmptyPane title={t(locale, "lists.emptyInvoice")} />}
    />
  );
}
