"use server";

import { revalidateS2P } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit, notify, notifyMany } from "@/lib/audit";
import { nextBC } from "@/lib/numbers";

export async function issuePO(formData: FormData) {
  const { current } = await requireUser();
  const requisitionId = String(formData.get("requisitionId"));
  const vendorId = String(formData.get("vendorId"));
  const terms = String(formData.get("terms") ?? "Payment 30 days from invoice date.");
  const r = await prisma.requisition.findUnique({ where: { id: requisitionId } });
  if (!r || r.status !== "approved") throw new Error("PR is not approved");

  const descs = formData.getAll("lineDesc").map(String);
  const qtys = formData.getAll("lineQty").map((v) => Number(String(v).replace(",", ".")));
  const units = formData.getAll("lineUnit").map(String);
  const prices = formData.getAll("linePrice").map((v) => Number(String(v).replace(",", ".")));
  const lines = descs
    .map((description, i) => ({
      description,
      qty: qtys[i] || 0,
      unit: units[i] || "u",
      unitPrice: prices[i] || 0,
    }))
    .filter((l) => l.description && l.qty > 0);

  if (lines.length === 0) {
    lines.push({ description: r.title, qty: 1, unit: "lump", unitPrice: r.amountHT });
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      number: await nextBC(),
      requisitionId,
      vendorId,
      terms,
      status: "issued",
      issuedById: current.id,
      lines: { create: lines },
    },
  });
  await prisma.requisition.update({ where: { id: requisitionId }, data: { status: "ordered" } });

  const vendorUsers = await prisma.user.findMany({ where: { vendorId, role: "VENDOR" } });
  await notifyMany(
    vendorUsers.map((u) => u.id),
    {
      title: `Purchase order ${po.number}`,
      body: `Helios Distribution issued a PO for “${r.title}”.`,
      href: `/commandes/${po.id}`,
    }
  );
  await notify({
    userId: r.requesterId,
    title: `${po.number} issued`,
    body: `Order placed with the vendor for ${r.title}.`,
    href: `/commandes/${po.id}`,
  });
  await audit({ entityType: "PurchaseOrder", entityId: po.id, action: "issue", actorId: current.id });
  revalidateS2P();
  redirect(`/commandes?id=${po.id}`);
}

export async function cancelPO(formData: FormData) {
  const { current } = await requireUser();
  const id = String(formData.get("id"));
  await prisma.purchaseOrder.update({ where: { id }, data: { status: "cancelled" } });
  await audit({ entityType: "PurchaseOrder", entityId: id, action: "cancel", actorId: current.id });
  revalidateS2P();
}
