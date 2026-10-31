"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit, notify, notifyMany } from "@/lib/audit";
import { nextAO } from "@/lib/numbers";
import { revalidateS2P } from "@/lib/revalidate";
import { parseConditions, serializeConditions, DEMO_NON_NEGOTIABLES } from "@/lib/conditions";

async function vendorUserIds(vendorIds: string[]) {
  const users = await prisma.user.findMany({
    where: { vendorId: { in: vendorIds }, role: "VENDOR" },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

function readConditions(formData: FormData): string {
  const raw = String(formData.get("nonNegotiables") ?? "");
  if (raw.trim().startsWith("[")) {
    return serializeConditions(parseConditions(raw));
  }
  // fallback: multiple fields
  const many = formData.getAll("nonNegotiable").map(String);
  if (many.length) return serializeConditions(many);
  return serializeConditions([...DEMO_NON_NEGOTIABLES]);
}

export async function createTender(formData: FormData) {
  const { current } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const briefing = String(formData.get("briefing") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "");
  const vendorIds = formData.getAll("vendorId").map(String);
  const requisitionId = String(formData.get("requisitionId") ?? "").trim();
  if (!title || !briefing || !deadline) throw new Error("Champs obligatoires manquants");

  const hugo = await prisma.user.findFirst({ where: { role: "OPENING_A" } });
  const florent = await prisma.user.findFirst({ where: { role: "VALIDATOR" } });
  if (!hugo || !florent) throw new Error("Officiers / valideur introuvables");

  const company = await prisma.company.findFirst();
  const defaults = company ? parseConditions(company.nonNegotiables) : [...DEMO_NON_NEGOTIABLES];
  const fromForm = parseConditions(String(formData.get("nonNegotiables") ?? ""));
  const nonNegotiables = serializeConditions(fromForm.length ? fromForm : defaults);

  const t = await prisma.tender.create({
    data: {
      number: await nextAO(),
      title,
      briefing,
      status: "draft",
      deadline: new Date(deadline),
      nonNegotiables,
      createdById: current.id,
      validatorId: florent.id,
      keyAUserId: hugo.id,
      keyBUserId: florent.id,
      invites: { create: vendorIds.map((vendorId) => ({ vendorId })) },
    },
  });
  if (requisitionId) {
    await prisma.requisition.update({ where: { id: requisitionId }, data: { tenderId: t.id } });
  }
  await audit({
    entityType: "Tender",
    entityId: t.id,
    action: "create",
    actorId: current.id,
    details: { title, requisitionId },
  });
  revalidateS2P();
  redirect(`/appels-offres/${t.id}`);
}

export async function updateBriefing(formData: FormData) {
  const { current } = await requireUser();
  const id = String(formData.get("id"));
  const briefing = String(formData.get("briefing") ?? "");
  const summary = String(formData.get("summary") ?? "Mise à jour du brief").trim();
  const t = await prisma.tender.findUnique({ where: { id }, include: { invites: true } });
  if (!t) throw new Error("AO introuvable");
  if (t.status === "opened" || t.status === "awarded") throw new Error("AO déjà ouvert");

  const nnRaw = formData.get("nonNegotiables");
  const data: { briefing: string; nonNegotiables?: string } = { briefing };
  if (nnRaw != null) {
    data.nonNegotiables = serializeConditions(parseConditions(String(nnRaw)));
  }

  await prisma.tender.update({ where: { id }, data });

  if (t.status === "published" || t.status === "closed") {
    await prisma.tenderVersion.create({
      data: {
        tenderId: id,
        changedById: current.id,
        summary,
        briefing,
        nonNegotiables: data.nonNegotiables ?? t.nonNegotiables,
      },
    });
    const uids = await vendorUserIds(t.invites.map((i) => i.vendorId));
    await notifyMany(uids, {
      title: `Addendum — ${t.number}`,
      body: `${current.name} a mis à jour le brief : ${summary}`,
      href: `/appels-offres/${id}`,
    });
    await audit({
      entityType: "Tender",
      entityId: id,
      action: "briefing_edit",
      actorId: current.id,
      details: { summary, conditionsChanged: nnRaw != null },
    });
  }
  revalidateS2P();
}

/** Acheteur : soumet le brouillon au valideur N+1 (avec mots de passe des clés). */
export async function requestValidation(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "BUYER") throw new Error("Seul l'acheteur peut demander la validation");
  const id = String(formData.get("id"));
  const passA = String(formData.get("passA") ?? "");
  const passB = String(formData.get("passB") ?? "");
  if (passA.length < 6 || passB.length < 6) throw new Error("Les deux mots de passe doivent faire au moins 6 caractères");
  const t = await prisma.tender.findUnique({ where: { id } });
  if (!t) throw new Error("AO introuvable");
  if (t.status !== "draft" && t.status !== "pending_validation") throw new Error("Statut incompatible");

  const validatorId = t.validatorId || (await prisma.user.findFirst({ where: { role: "VALIDATOR" } }))?.id;
  if (!validatorId) throw new Error("Aucun valideur N+1");

  await prisma.tender.update({
    where: { id },
    data: {
      status: "pending_validation",
      validatorId,
      validationNote: null,
      keyAHash: await bcrypt.hash(passA, 10),
      keyBHash: await bcrypt.hash(passB, 10),
      keyAUnlocked: false,
      keyBUnlocked: false,
    },
  });
  await notify({
    userId: validatorId,
    title: `Validation requise — ${t.number}`,
    body: `${current.name} soumet « ${t.title} » pour validation avant publication.`,
    href: `/appels-offres/${id}`,
  });
  await audit({
    entityType: "Tender",
    entityId: id,
    action: "validation_request",
    actorId: current.id,
  });
  revalidateS2P();
}

/** Valideur N+1 : publie auprès des fournisseurs. */
export async function validateTender(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "VALIDATOR") throw new Error("Seul le valideur N+1 peut valider");
  const id = String(formData.get("id"));
  const t = await prisma.tender.findUnique({ where: { id }, include: { invites: true } });
  if (!t) throw new Error("AO introuvable");
  if (t.status !== "pending_validation") throw new Error("AO non en attente de validation");
  if (t.validatorId && t.validatorId !== current.id) throw new Error("Vous n'êtes pas le valideur de cet AO");

  await prisma.tender.update({
    where: { id },
    data: { status: "published", publishedAt: new Date(), validationNote: null },
  });
  const uids = await vendorUserIds(t.invites.map((i) => i.vendorId));
  await notifyMany(uids, {
    title: `Nouvel AO ${t.number}`,
    body: `${t.title} — déposez votre offre avant l'échéance.`,
    href: `/appels-offres/${id}`,
  });
  await notify({
    userId: t.createdById,
    title: `AO validé — ${t.number}`,
    body: `${current.name} a validé et publié l'appel d'offres.`,
    href: `/appels-offres/${id}`,
  });
  await audit({ entityType: "Tender", entityId: id, action: "validation_ok", actorId: current.id });
  await audit({ entityType: "Tender", entityId: id, action: "publish", actorId: current.id });
  revalidateS2P();
}

/** Valideur N+1 : renvoie au brouillon avec commentaire. */
export async function returnTender(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "VALIDATOR") throw new Error("Seul le valideur N+1 peut renvoyer");
  const id = String(formData.get("id"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) throw new Error("Un commentaire est obligatoire pour renvoyer");
  const t = await prisma.tender.findUnique({ where: { id } });
  if (!t) throw new Error("AO introuvable");
  if (t.status !== "pending_validation") throw new Error("AO non en attente de validation");

  await prisma.tender.update({
    where: { id },
    data: { status: "draft", validationNote: comment },
  });
  await notify({
    userId: t.createdById,
    title: `AO renvoyé — ${t.number}`,
    body: `${current.name} : ${comment}`,
    href: `/appels-offres/${id}`,
  });
  await audit({
    entityType: "Tender",
    entityId: id,
    action: "validation_return",
    actorId: current.id,
    details: { comment },
  });
  revalidateS2P();
}

/** Legacy publish kept for drafts in demos without validation gate — routes to requestValidation path if buyer. */
export async function publishTender(formData: FormData) {
  const { current } = await requireUser();
  if (current.role === "VALIDATOR") {
    return validateTender(formData);
  }
  return requestValidation(formData);
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
    body: `Vous êtes invité à répondre à : ${t?.title}`,
    href: `/appels-offres/${tenderId}`,
  });
  await audit({ entityType: "Tender", entityId: tenderId, action: "invite", actorId: current.id, details: { vendorId } });
  revalidateS2P();
}

export async function submitBid(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "VENDOR" || !current.vendorId) throw new Error("Seul un fournisseur peut déposer une offre");
  const tenderId = String(formData.get("tenderId"));
  const t = await prisma.tender.findUnique({ where: { id: tenderId } });
  if (!t) throw new Error("AO introuvable");
  if (new Date() > t.deadline) throw new Error("Échéance dépassée");
  if (t.status !== "published") throw new Error("AO non ouvert aux offres");

  const accepted = String(formData.get("conditionsAccepted") ?? "") === "1";
  const items = parseConditions(t.nonNegotiables);
  if (items.length && !accepted) {
    throw new Error("Vous devez accepter toutes les conditions non négociables pour déposer une offre.");
  }
  const acceptedAt = new Date();
  const acceptedConditions = JSON.stringify({
    items,
    acceptedAt: acceptedAt.toISOString(),
  });

  const price = Number(String(formData.get("price")).replace(",", "."));
  const leadTimeDays = Number(formData.get("leadTimeDays"));
  const comments = String(formData.get("comments") ?? "");
  await prisma.bid.upsert({
    where: { tenderId_vendorId: { tenderId, vendorId: current.vendorId } },
    update: {
      payload: JSON.stringify({ price, leadTimeDays, comments }),
      submittedAt: new Date(),
      acceptedConditions,
    },
    create: {
      tenderId,
      vendorId: current.vendorId,
      payload: JSON.stringify({ price, leadTimeDays, comments }),
      acceptedConditions,
    },
  });
  await audit({
    entityType: "Tender",
    entityId: tenderId,
    action: "bid_submit",
    actorId: current.id,
    details: { conditionsAcceptedAt: acceptedAt.toISOString(), conditionsCount: items.length },
  });
  await audit({
    entityType: "Tender",
    entityId: tenderId,
    action: "conditions_accepted",
    actorId: current.id,
    details: { items, acceptedAt: acceptedAt.toISOString() },
  });
  await notify({
    userId: t.createdById,
    title: `Offre déposée — ${t.number}`,
    body: `${current.name} a déposé une offre scellée.`,
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
  if (!t) throw new Error("AO introuvable");
  if (new Date() < t.deadline) throw new Error("Ouverture impossible avant l'échéance");

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
  if (!t || t.status !== "opened") throw new Error("AO non encore ouvert");
  await prisma.tender.update({ where: { id: tenderId }, data: { status: "awarded", awardedBidId: bidId } });
  const bid = t.bids.find((b) => b.id === bidId);
  await audit({ entityType: "Tender", entityId: tenderId, action: "award", actorId: current.id, details: { bidId } });
  if (bid) {
    const uids = await vendorUserIds([bid.vendorId]);
    await notifyMany(uids, {
      title: `Offre retenue — ${t.number}`,
      body: `Votre offre a été retenue pour « ${t.title} ».`,
      href: `/appels-offres/${tenderId}`,
    });
  }
  revalidateS2P();
  redirect(`/appels-offres/${tenderId}?tab=cles`);
}

export async function updateOrgNonNegotiables(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "BUYER" && current.role !== "VALIDATOR") {
    throw new Error("Non autorisé");
  }
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Organisation introuvable");
  const items = parseConditions(String(formData.get("nonNegotiables") ?? "[]"));
  await prisma.company.update({
    where: { id: company.id },
    data: { nonNegotiables: serializeConditions(items) },
  });
  await audit({
    entityType: "Company",
    entityId: company.id,
    action: "org_conditions_edit",
    actorId: current.id,
    details: { count: items.length },
  });
  revalidateS2P();
}
