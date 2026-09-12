"use server";

import { revalidateS2P } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit, notify, notifyMany } from "@/lib/audit";
import { nextBR } from "@/lib/numbers";

export async function confirmReceipt(formData: FormData) {
  const { current } = await requireUser();
  const poId = String(formData.get("poId"));
  const type = String(formData.get("type") ?? "GOODS");
  const notes = String(formData.get("notes") ?? "");
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { lines: true, vendor: true, requisition: true },
  });
  if (!po) throw new Error("PO not found");

  const qtys = po.lines.map((l) => Number(String(formData.get(`qty_${l.id}`) ?? "0").replace(",", ".")));
  const receivedLines = po.lines.map((l, i) => ({
    poLineId: l.id,
    description: l.description,
    qtyOrdered: l.qty,
    qtyReceived: qtys[i] || 0,
    unitPrice: l.unitPrice,
  }));

  const amount = receivedLines.reduce((s, l) => s + l.qtyReceived * l.unitPrice, 0);
  const anyShort = receivedLines.some((l) => l.qtyReceived + 0.0001 < l.qtyOrdered);

  const previous = await prisma.gRLine.findMany({
    where: { receipt: { poId } },
  });
  const receivedSoFar = new Map<string, number>();
  for (const l of previous) {
    receivedSoFar.set(l.poLineId, (receivedSoFar.get(l.poLineId) ?? 0) + l.qtyReceived);
  }
  for (const l of receivedLines) {
    receivedSoFar.set(l.poLineId, (receivedSoFar.get(l.poLineId) ?? 0) + l.qtyReceived);
  }
  const fully = po.lines.every((l) => (receivedSoFar.get(l.id) ?? 0) + 0.0001 >= l.qty);

  const gr = await prisma.goodsReceipt.create({
    data: {
      number: await nextBR(),
      poId,
      type,
      receivedById: current.id,
      notes,
      status: "confirmed",
      lines: { create: receivedLines },
      accruals: {
        create: {
          accountCode: type === "SERVICE" ? "408" : "408",
          amount,
          status: "open",
        },
      },
    },
  });

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status: fully ? "received" : "partially_received" },
  });

  const vendorUsers = await prisma.user.findMany({ where: { vendorId: po.vendorId, role: "VENDOR" } });
  const gapTxt = anyShort
    ? `Variance: quantity received below ordered (${gr.number}).`
    : `Receipt in line ${gr.number}.`;
  await notifyMany(
    vendorUsers.map((u) => u.id),
    {
      title: anyShort ? `Receipt variance ${gr.number}` : `Receipt ${gr.number}`,
      body: `${gapTxt} Goods received, invoice not in yet: ${amount.toLocaleString("en-GB")} € excl. VAT.`,
      href: `/receptions/${gr.id}`,
    }
  );
  await notify({
    userId: po.requisition.requesterId,
    title: `${gr.number} confirmed`,
    body: gapTxt,
    href: `/receptions/${gr.id}`,
  });
  const ap = await prisma.user.findFirst({ where: { role: "AP" } });
  if (ap) {
    await notify({
      userId: ap.id,
      title: `Goods received, invoice not in yet — ${gr.number}`,
      body: `${amount.toLocaleString("en-GB")} € excl. VAT — ${po.vendor.name}`,
      href: `/receptions/${gr.id}`,
    });
  }
  await audit({
    entityType: "GoodsReceipt",
    entityId: gr.id,
    action: "confirm",
    actorId: current.id,
    details: { amount, anyShort },
  });
  revalidateS2P();
  redirect(`/receptions?id=${gr.id}`);
}
