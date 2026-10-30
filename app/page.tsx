import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { AOTable, type AORow, type KpiStats } from "@/components/AOTable";
import { extractBudget } from "@/lib/budget";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; sort?: string; dir?: string; q?: string }>;
}) {
  const { view, sort, dir, q } = await searchParams;
  const locale = await getLocale();
  const { current } = await requireUser();
  const isSupplier = current.role === "VENDOR";
  const canCreate = current.role === "BUYER" || current.role === "N4";
  const now = Date.now();

  const tenders = await prisma.tender.findMany({
    include: { invites: true, bids: true },
    orderBy: { number: "asc" },
  });

  const visible =
    isSupplier && current.vendorId
      ? tenders.filter((x) => x.invites.some((i) => i.vendorId === current.vendorId))
      : tenders;

  const rows: AORow[] = visible.map((t) => {
    const myBid = current.vendorId ? t.bids.find((b) => b.vendorId === current.vendorId) : undefined;
    const budget = extractBudget(t.briefing);
    const cat = t.briefing.match(/<!--\s*bid-category:([^>]+)\s*-->/i)?.[1]?.trim();
    return {
      id: t.id,
      number: t.number,
      title: t.title,
      category: cat,
      status: t.status,
      deadline: t.deadline,
      bidCount: t.bids.length,
      inviteCount: t.invites.length,
      keyAUnlocked: t.keyAUnlocked,
      keyBUnlocked: t.keyBUnlocked,
      budget,
      myOfferSubmittedAt: myBid?.submittedAt ?? null,
      myOfferSealed: Boolean(myBid),
    };
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  let kpis: KpiStats | undefined;
  if (!isSupplier) {
    const open = tenders.filter((t) => t.status === "published" && t.deadline.getTime() > now);
    const amountUnder = open.reduce((s, t) => s + (extractBudget(t.briefing) ?? 0), 0);
    const offersMonth = tenders.reduce(
      (s, t) => s + t.bids.filter((b) => b.submittedAt >= monthStart).length,
      0
    );
    const awarded = tenders.filter((t) => t.status === "awarded" && t.openedAt);
    let avgAwardDays: number | null = null;
    if (awarded.length) {
      const days = awarded.map((t) => {
        const openAt = t.openedAt!.getTime();
        // approximate award = updated via openedAt + small; use createdAt span if needed
        return Math.max(1, Math.round((openAt - (t.publishedAt?.getTime() ?? t.createdAt.getTime())) / 86400000) + 2);
      });
      avgAwardDays = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    }
    let savingsPct: number | null = null;
    const withBudget = awarded
      .map((t) => {
        const budget = extractBudget(t.briefing);
        const bid = t.bids.find((b) => b.id === t.awardedBidId);
        if (!budget || !bid) return null;
        try {
          const price = (JSON.parse(bid.payload) as { price: number }).price;
          return ((budget - price) / budget) * 100;
        } catch {
          return null;
        }
      })
      .filter((x): x is number => x != null);
    if (withBudget.length) {
      savingsPct = withBudget.reduce((a, b) => a + b, 0) / withBudget.length;
    }
    kpis = {
      openCount: open.length,
      amountUnder,
      offersMonth,
      avgAwardDays,
      savingsPct,
    };
  }

  return (
    <AOTable
      rows={rows}
      locale={locale}
      isSupplier={isSupplier}
      canCreate={canCreate}
      view={view ?? "all"}
      sort={sort ?? "deadline"}
      dir={dir === "desc" ? "desc" : "asc"}
      q={q}
      now={now}
      kpis={kpis}
    />
  );
}
