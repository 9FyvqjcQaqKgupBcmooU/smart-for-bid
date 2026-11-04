import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isRevealed, revealBids, logSealedDenied } from "@/lib/sealed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bid export (JSON). Denied — and logged in the audit chain — before the two-key opening. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { current } = await requireUser();
  const t = await prisma.tender.findUnique({ where: { id }, include: { bids: { include: { vendor: true } } } });
  if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const headers = { "Cache-Control": "no-store" };
  if (current.role === "VENDOR") {
    await logSealedDenied(id, current.id, "GET /appels-offres/[id]/bids.json", "supplier_role");
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers });
  }
  if (!isRevealed(t)) {
    await logSealedDenied(id, current.id, "GET /appels-offres/[id]/bids.json", "sealed_before_two_key_opening");
    return NextResponse.json(
      { error: "sealed", message: "Bids are sealed until the two-key opening.", bidCount: t.bids.length },
      { status: 423, headers }
    );
  }
  return NextResponse.json(
    {
      number: t.number,
      bids: revealBids(t, t.bids).map((b) => ({
        vendor: b.vendor.name,
        price: b.data.price,
        leadTimeDays: b.data.leadTimeDays,
        submittedAt: b.submittedAt.toISOString(),
        dossierVersion: b.dossierVersion ?? 1,
      })),
    },
    { headers }
  );
}
