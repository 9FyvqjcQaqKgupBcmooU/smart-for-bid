import { requireUser } from "@/lib/session";
import { getInbox, pickInboxItem } from "@/lib/inbox";
import { Workbench, EmptyPane } from "@/components/chrome";
import { InboxList } from "@/components/InboxList";
import { InboxRight } from "@/components/panes/InboxRight";
import { AOPane } from "@/components/panes/AOPane";
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
  const name = firstName(current.name);
  const n = items.length;
  const greeting =
    n === 0
      ? t(locale, "home.greetingZero", { name })
      : n === 1
        ? t(locale, "home.greetingOne", { name })
        : t(locale, "home.greetingMany", { name, n });

  const pane = selected ? (
    <InboxRight item={selected} tab={tab ?? "brief"} />
  ) : furniture ? (
    <AOPane id={furniture.id} tab={tab ?? "brief"} />
  ) : (
    <EmptyPane title={t(locale, "home.emptyTitle")} />
  );

  return (
    <Workbench
      leftClassName="w-[272px]"
      left={
        <>
          <div className="px-4 pb-2 pt-4">
            <p className="text-[16px] font-medium leading-6 text-ink">{greeting}</p>
          </div>
          <InboxList items={items} selectedKey={selected?.key} locale={locale} />
        </>
      }
      right={pane}
    />
  );
}
