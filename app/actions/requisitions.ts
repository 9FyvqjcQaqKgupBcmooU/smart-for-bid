"use server";

import { revalidateS2P } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit, notify } from "@/lib/audit";
import { nextDA } from "@/lib/numbers";
import { approverForLevel, levelsForAmount } from "@/lib/approvals";

export async function createRequisition(formData: FormData) {
  const { current } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "ONE_OFF");
  const amountHT = Number(String(formData.get("amountHT")).replace(",", "."));
  const costCenter = String(formData.get("costCenter") ?? "").trim();
  const neededBy = String(formData.get("neededBy") ?? "");
  if (!title || !amountHT || !costCenter || !neededBy) throw new Error("Required fields missing");

  const r = await prisma.requisition.create({
    data: {
      number: await nextDA(),
      title,
      description,
      type,
      amountHT,
      costCenter,
      neededBy: new Date(neededBy),
      status: "draft",
      requesterId: current.id,
    },
  });
  await audit({ entityType: "Requisition", entityId: r.id, action: "create", actorId: current.id });
  revalidateS2P();
  redirect(`/demandes?id=${r.id}`);
}

export async function submitRequisition(formData: FormData) {
  const { current } = await requireUser();
  const id = String(formData.get("id"));
  const r = await prisma.requisition.findUnique({ where: { id } });
  if (!r) throw new Error("PR not found");
  const levels = await levelsForAmount(r.amountHT);
  await prisma.approvalStep.deleteMany({ where: { requisitionId: id } });
  for (let i = 0; i < levels.length; i++) {
    const approver = await approverForLevel(levels[i]);
    await prisma.approvalStep.create({
      data: {
        requisitionId: id,
        level: levels[i],
        approverId: approver.id,
        status: i === 0 ? "pending" : "waiting",
        stepOrder: i + 1,
      },
    });
    if (i === 0) {
      await notify({
        userId: approver.id,
        title: `${r.number} awaiting your approval`,
        body: `${r.title} — ${r.amountHT.toLocaleString("en-GB")} € excl. VAT`,
        href: `/demandes/${id}`,
      });
    }
  }
  await prisma.requisition.update({
    where: { id },
    data: { status: "pending", submittedAt: new Date() },
  });
  await audit({ entityType: "Requisition", entityId: id, action: "submit", actorId: current.id, details: { levels } });
  revalidateS2P();
}

export async function decideStep(formData: FormData) {
  const { current } = await requireUser();
  const stepId = String(formData.get("stepId"));
  const decision = String(formData.get("decision"));
  const comment = String(formData.get("comment") ?? "");
  const step = await prisma.approvalStep.findUnique({
    where: { id: stepId },
    include: { requisition: true, invoice: true },
  });
  if (!step) throw new Error("Step not found");
  if (step.approverId !== current.id) throw new Error("You are not the approver for this step");
  if (step.status !== "pending") throw new Error("Step already processed");

  await prisma.approvalStep.update({
    where: { id: stepId },
    data: { status: decision === "approve" ? "approved" : "rejected", decidedAt: new Date(), comment },
  });

  if (step.requisitionId && step.requisition) {
    const r = step.requisition;
    if (decision === "reject") {
      await prisma.requisition.update({ where: { id: r.id }, data: { status: "rejected" } });
      await prisma.approvalStep.updateMany({
        where: { requisitionId: r.id, status: "waiting" },
        data: { status: "skipped" },
      });
      await notify({
        userId: r.requesterId,
        title: `${r.number} rejected`,
        body: `${current.name} (${step.level}): ${comment || "no comment"}`,
        href: `/demandes/${r.id}`,
      });
    } else {
      const next = await prisma.approvalStep.findFirst({
        where: { requisitionId: r.id, status: "waiting" },
        orderBy: { stepOrder: "asc" },
      });
      if (next) {
        await prisma.approvalStep.update({ where: { id: next.id }, data: { status: "pending" } });
        await notify({
          userId: next.approverId,
          title: `${r.number} awaiting your approval`,
          body: `${r.title} — already approved up to ${step.level}.`,
          href: `/demandes/${r.id}`,
        });
      } else {
        await prisma.requisition.update({ where: { id: r.id }, data: { status: "approved" } });
        const lea = await prisma.user.findFirst({ where: { role: "BUYER" } });
        if (lea) {
          await notify({
            userId: lea.id,
            title: `${r.number} approved — to order`,
            body: r.title,
            href: `/demandes/${r.id}`,
          });
        }
        await notify({
          userId: r.requesterId,
          title: `${r.number} approved`,
          body: "All approvals obtained. The buyer can issue the PO.",
          href: `/demandes/${r.id}`,
        });
      }
    }
    await audit({
      entityType: "Requisition",
      entityId: r.id,
      action: decision,
      actorId: current.id,
      details: { level: step.level, comment },
    });
    revalidateS2P();
  }

  if (step.invoiceId && step.invoice) {
    const inv = step.invoice;
    if (decision === "reject") {
      await prisma.invoice.update({ where: { id: inv.id }, data: { status: "rejected" } });
    } else {
      const next = await prisma.approvalStep.findFirst({
        where: { invoiceId: inv.id, status: "waiting" },
        orderBy: { stepOrder: "asc" },
      });
      if (next) {
        await prisma.approvalStep.update({ where: { id: next.id }, data: { status: "pending" } });
      } else {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: "approved", mismatchApproverId: current.id },
        });
      }
    }
    await audit({
      entityType: "Invoice",
      entityId: inv.id,
      action: `ecart_${decision}`,
      actorId: current.id,
      details: { comment },
    });
    revalidateS2P();
  }
}
