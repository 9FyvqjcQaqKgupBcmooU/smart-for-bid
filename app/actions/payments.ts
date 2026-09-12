"use server";

import { revalidateS2P } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit, notify, notifyMany } from "@/lib/audit";
import { nextPAY } from "@/lib/numbers";

export async function runPayment(formData: FormData) {
  const { current } = await requireUser();
  const ids = formData.getAll("invoiceId").map(String);
  const paymentDate = String(formData.get("paymentDate") || new Date().toISOString().slice(0, 10));
  if (ids.length === 0) throw new Error("Select at least one invoice");

  const invoices = await prisma.invoice.findMany({
    where: { id: { in: ids }, status: "approved" },
    include: { vendor: true, po: { include: { receipts: { include: { accruals: true } } } } },
  });
  if (invoices.length === 0) throw new Error("No approved invoice selected");

  const pay = await prisma.payment.create({
    data: {
      runNumber: await nextPAY(),
      method: "transfer",
      paymentDate: new Date(paymentDate),
      status: "executed",
      executedById: current.id,
      items: {
        create: invoices.map((inv) => ({ invoiceId: inv.id, amount: inv.amountTTC })),
      },
    },
  });

  await prisma.invoice.updateMany({ where: { id: { in: invoices.map((i) => i.id) } }, data: { status: "paid" } });

  const accrualIds = invoices
    .flatMap((i) => i.po?.receipts.flatMap((r) => r.accruals) ?? [])
    .filter((a) => a.status === "open")
    .map((a) => a.id);
  if (accrualIds.length) {
    await prisma.accrual.updateMany({ where: { id: { in: accrualIds } }, data: { status: "closed" } });
  }

  for (const inv of invoices) {
    const vUsers = await prisma.user.findMany({ where: { vendorId: inv.vendorId, role: "VENDOR" } });
    await notifyMany(
      vUsers.map((u) => u.id),
      {
        title: `Payment executed — ${inv.number}`,
        body: `${inv.amountTTC.toLocaleString("en-GB")} € incl. VAT, run ${pay.runNumber}.`,
        href: `/paiements`,
      }
    );
  }
  await audit({
    entityType: "Payment",
    entityId: pay.id,
    action: "execute",
    actorId: current.id,
    details: { count: invoices.length },
  });
  revalidateS2P();
  if (invoices.length === 1) {
    redirect(`/factures?id=${invoices[0].id}`);
  }
  redirect("/paiements");
}
