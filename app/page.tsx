import { requireUser } from "@/lib/session";
import { getInbox, pickInboxItem } from "@/lib/inbox";
import { Workbench, EmptyPane } from "@/components/chrome";
import { InboxList } from "@/components/InboxList";
import { InboxRight } from "@/components/panes/InboxRight";
import { AOPane } from "@/components/panes/AOPane";
import { JobStrip } from "@/components/home/JobStrip";
import { firstName } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { FEATURED_RFQ_NUMBER } from "@/lib/demo";

export default async function Home({ searchParams }: { searchParams: Promise<{ item?: string; id?: string; tab?: string }> }) {
  const { item: itemKey, id, tab } = await searchParams;
  const locale = await getLocale();
  const { current } = await requireUser();
  const items = await getInbox(current, locale);
  const selected = pickInboxItem(items, itemKey ?? (id ? `ao:${id}` : undefined) ?? id);
  const furniture =
    selected
      ? null
      : await prisma.tender.findFirst({ where: { number: FEATURED_RFQ_NUMBER }, select: { id: true } });
  const featured =
    selected?.number === FEATURED_RFQ_NUMBER
      ? selected
      : items.find((i) => i.number === FEATURED_RFQ_NUMBER) ?? selected ?? null;
  const name = firstName(current.name);
  const isSupplier = current.role === "VENDOR";
  const canCreate = current.role === "BUYER" || current.role === "N4";
  const canSubmit = Boolean(featured?.actionable && isSupplier);

  const greeting = isSupplier
    ? !featured
      ? t(locale, "home.greetingSupplierClear", { name })
      : canSubmit
        ? t(locale, "home.greetingSupplierJob", { name })
        : t(locale, "home.greetingSupplierFollow", { name })
    : featured
      ? t(locale, "home.greetingClientJob", { name })
      : t(locale, "home.greetingClientClear", { name });

  const pane = selected ? (
    <InboxRight item={selected} tab={tab ?? (isSupplier ? "brief" : "opening")} />
  ) : furniture ? (
    <AOPane id={furniture.id} tab={tab ?? (isSupplier ? "brief" : "opening")} />
  ) : (
    <EmptyPane title={t(locale, "home.emptyTitle")} />
  );

  return (
    <Workbench
      leftClassName="w-[272px]"
      left={
        <>
          <div className="px-4 pb-1 pt-4">
            <p className="text-[16px] font-medium leading-6 text-ink">{greeting}</p>
          </div>
          <JobStrip
            locale={locale}
            role={current.role}
            itemKey={featured?.key}
            canCreate={canCreate}
            canSubmit={canSubmit}
          />
          <InboxList items={items} selectedKey={selected?.key} locale={locale} />
        </>
      }
      right={pane}
    />
  );
}
