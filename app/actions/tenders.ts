"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit, notify, notifyMany } from "@/lib/audit";
import { nextAO } from "@/lib/numbers";
import { revalidateS2P } from "@/lib/revalidate";

async function vendorUserIds(vendorIds: string[]) {
  const users = await prisma.user.findMany({
    where: { vendorId: { in: vendorIds }, role: "VENDOR" },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function createTender(formData: FormData) {
  const { current } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const briefing = String(formData.get("briefing") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "");
  const vendorIds = formData.getAll("vendorId").map(String);
  const requisitionId = String(formData.get("requisitionId") ?? "").trim();
  if (!title || !briefing || !deadline) throw new Error("Required fields missing");

  const hugo = await prisma.user.findFirst({ where: { role: "OPENING_A" } });
  const ines = await prisma.user.findFirst({ where: { role: "OPENING_B" } });
  if (!hugo || !ines) throw new Error("Bid officers not found");

  const t = await prisma.tender.create({
    data: {
      number: await nextAO(),
      title,
      briefing,
      status: "draft",
      deadline: new Date(deadline),
      createdById: current.id,
      keyAUserId: hugo.id,
      keyBUserId: ines.id,
      invites: { create: vendorIds.map((vendorId) => ({ vendorId })) },
    },
  });
  if (requisitionId) {
    await prisma.requisition.update({ where: { id: requisitionId }, data: { tenderId: t.id } });
  }
  await audit({ entityType: "Tender", entityId: t.id, action: "create", actorId: current.id, details: { title, requisitionId } });
  revalidateS2P();
  redirect(`/appels-offres?id=${t.id}`);
}

export async function updateBriefing(formData: FormData) {
  const { current } = await requireUser();
  const id = String(formData.get("id"));
  const briefing = String(formData.get("briefing") ?? "");
  const summary = String(formData.get("summary") ?? "Briefing update").trim();
  const t = await prisma.tender.findUnique({ where: { id }, include: { invites: true } });
  if (!t) throw new Error("RFQ not found");
  if (t.status === "opened" || t.status === "awarded") throw new Error("RFQ already opened");

  await prisma.tender.update({ where: { id }, data: { briefing } });

  if (t.status === "published" || t.status === "closed") {
    await prisma.tenderVersion.create({
      data: { tenderId: id, changedById: current.id, summary, briefing },
    });
    const uids = await vendorUserIds(t.invites.map((i) => i.vendorId));
    await notifyMany(uids, {
      title: `Addendum — ${t.number}`,
      body: `${current.name} updated the briefing: ${summary}`,
      href: `/appels-offres/${id}`,
    });
    await audit({
      entityType: "Tender",
      entityId: id,
      action: "briefing_edit",
      actorId: current.id,
      details: { summary },
    });
  }
  revalidateS2P();
}

export async function publishTender(formData: FormData) {
  const { current } = await requireUser();
  const id = String(formData.get("id"));
  const passA = String(formData.get("passA") ?? "");
  const passB = String(formData.get("passB") ?? "");
  if (passA.length < 6 || passB.length < 6) throw new Error("Both passwords must be at least 6 characters");
  const t = await prisma.tender.findUnique({ where: { id }, include: { invites: true } });
  if (!t) throw new Error("RFQ not found");

  await prisma.tender.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
      keyAHash: await bcrypt.hash(passA, 10),
      keyBHash: await bcrypt.hash(passB, 10),
      keyAUnlocked: false,
      keyBUnlocked: false,
    },
  });
  const uids = await vendorUserIds(t.invites.map((i) => i.vendorId));
  await notifyMany(uids, {
    title: `New RFQ ${t.number}`,
    body: `${t.title} — submit bids before the deadline.`,
    href: `/appels-offres/${id}`,
  });
  await audit({ entityType: "Tender", entityId: id, action: "publish", actorId: current.id });
  revalidateS2P();
}

export async function inviteVendor(formData: FormData) {
  const { current } = await requireUser();
  const tenderId = String(formData.get("tenderId"));
  const vendorId = String(formData.get("vendorId"));
  await prisma.tenderInvite.upsert({
    where: { tenderId_vendorId: { tenderId, vendorId } },
    update: { notifiedAt: new Date() },
    create: { tenderId, vendorId, notifiedAt: new Date() },
  });
  const t = await prisma.tender.findUnique({ where: { id: tenderId } });
  const uids = await vendorUserIds([vendorId]);
  await notifyMany(uids, {
    title: `Invitation ${t?.number}`,
    body: `You are invited to bid on: ${t?.title}`,
    href: `/appels-offres/${tenderId}`,
  });
  await audit({ entityType: "Tender", entityId: tenderId, action: "invite", actorId: current.id, details: { vendorId } });
  revalidateS2P();
}

export async function submitBid(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "VENDOR" || !current.vendorId) throw new Error("Only a vendor can submit a bid");
  const tenderId = String(formData.get("tenderId"));
  const t = await prisma.tender.findUnique({ where: { id: tenderId } });
  if (!t) throw new Error("RFQ not found");
  if (new Date() > t.deadline) throw new Error("Deadline passed");
  if (t.status !== "published") throw new Error("RFQ is not open for bids");
  const price = Number(String(formData.get("price")).replace(",", "."));
  const leadTimeDays = Number(formData.get("leadTimeDays"));
  const comments = String(formData.get("comments") ?? "");
  await prisma.bid.upsert({
    where: { tenderId_vendorId: { tenderId, vendorId: current.vendorId } },
    update: { payload: JSON.stringify({ price, leadTimeDays, comments }), submittedAt: new Date() },
    create: {
      tenderId,
      vendorId: current.vendorId,
      payload: JSON.stringify({ price, leadTimeDays, comments }),
    },
  });
  await audit({ entityType: "Tender", entityId: tenderId, action: "bid_submit", actorId: current.id });
  await notify({
    userId: t.createdById,
    title: `Bid submitted — ${t.number}`,
    body: `${current.name} submitted a sealed bid.`,
    href: `/appels-offres/${tenderId}`,
  });
  revalidateS2P();
}

export async function unlockTender(formData: FormData) {
  const { current } = await requireUser();
  const id = String(formData.get("id"));
  const lock = String(formData.get("lock"));
  const password = String(formData.get("password") ?? "");
  const t = await prisma.tender.findUnique({ where: { id } });
  if (!t) throw new Error("RFQ not found");
  if (new Date() < t.deadline) throw new Error("Cannot open before the deadline");

  const expectedUser = lock === "A" ? t.keyAUserId : t.keyBUserId;
  const hash = lock === "A" ? t.keyAHash : t.keyBHash;
  const okUser = current.id === expectedUser;
  const okPass = hash ? await bcrypt.compare(password, hash) : false;
  const success = okUser && okPass;

  await prisma.tenderOpening.create({
    data: { tenderId: id, officerId: current.id, lock, success },
  });
  await audit({
    entityType: "Tender",
    entityId: id,
    action: success ? "unlock_ok" : "unlock_fail",
    actorId: current.id,
    details: { lock, okUser },
  });

  if (!success) {
    revalidateS2P();
    return { ok: false, reason: !okUser ? "wrong_officer" : "bad_password" };
  }

  const data = lock === "A" ? { keyAUnlocked: true } : { keyBUnlocked: true };
  const updated = await prisma.tender.update({ where: { id }, data });
  const both = (lock === "A" ? true : updated.keyAUnlocked) && (lock === "B" ? true : updated.keyBUnlocked);
  if (both) {
    await prisma.tender.update({ where: { id }, data: { status: "opened", openedAt: new Date() } });
    await audit({ entityType: "Tender", entityId: id, action: "opened", actorId: current.id });
  }
  revalidateS2P();
  return { ok: true };
}

export async function awardBid(formData: FormData) {
  const { current } = await requireUser();
  const tenderId = String(formData.get("tenderId"));
  const bidId = String(formData.get("bidId"));
  const t = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: { bids: true },
  });
  if (!t || t.status !== "opened") throw new Error("RFQ is not opened");
  await prisma.tender.update({ where: { id: tenderId }, data: { status: "awarded", awardedBidId: bidId } });
  const bid = t.bids.find((b) => b.id === bidId);
  await audit({ entityType: "Tender", entityId: tenderId, action: "award", actorId: current.id, details: { bidId } });
  if (bid) {
    const uids = await vendorUserIds([bid.vendorId]);
    await notifyMany(uids, {
      title: `Bid awarded — ${t.number}`,
      body: `Your bid was awarded for “${t.title}”.`,
      href: `/appels-offres?id=${tenderId}`,
    });
  }
  revalidateS2P();
  redirect(`/appels-offres?id=${tenderId}`);
}
