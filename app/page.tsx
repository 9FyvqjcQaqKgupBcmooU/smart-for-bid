import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { AOTable, type AORow } from "@/components/AOTable";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; dir?: string; q?: string }>;
}) {
  const { status, sort, dir, q } = await searchParams;
  const locale = await getLocale();
  const { current } = await requireUser();
  const isSupplier = current.role === "VENDOR";
  const canCreate = current.role === "BUYER" || current.role === "N4";

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
    return {
      id: t.id,
      number: t.number,
      title: t.title,
      status: t.status,
      deadline: t.deadline,
      bidCount: t.bids.length,
      inviteCount: t.invites.length,
      keyAUnlocked: t.keyAUnlocked,
      keyBUnlocked: t.keyBUnlocked,
      myOfferSubmittedAt: myBid?.submittedAt ?? null,
      myOfferSealed: Boolean(myBid),
    };
  });

  return (
    <AOTable
      rows={rows}
      locale={locale}
      isSupplier={isSupplier}
      canCreate={canCreate}
      statusFilter={status ?? "all"}
      sort={sort ?? "deadline"}
      dir={dir === "desc" ? "desc" : "asc"}
      q={q}
      now={Date.now()}
    />
  );
}
