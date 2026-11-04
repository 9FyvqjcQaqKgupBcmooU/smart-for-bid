"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit, notify, notifyMany } from "@/lib/audit";
import { nextAO } from "@/lib/numbers";
import { revalidateS2P } from "@/lib/revalidate";
import { parseConditions, serializeConditions, DEMO_NON_NEGOTIABLES } from "@/lib/conditions";
import { sealPayload, stripInternalMarkers } from "@/lib/seal-crypto";
import { bumpDossier, ensureDossier, isRevealed, logSealedDenied } from "@/lib/sealed";
import { formatParisStamp } from "@/lib/format";
import { parisLocalToDate, toParisLocalInput } from "@/lib/paris-time";

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

  const claireA = await prisma.user.findFirst({ where: { role: "OPENING_A" } });
  const florent = await prisma.user.findFirst({ where: { role: "VALIDATOR" } });
  if (!claireA || !florent) throw new Error("Officiers / valideur introuvables");

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
      keyAUserId: claireA.id,
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

/** Records a supplier-visible change: bump version, notify all invited, chain it, flag post-bid changes. */
async function recordDossierChanges(opts: {
  tenderId: string;
  actor: { id: string; name: string };
  summary: string;
  changes: { field: string; before: string; after: string }[];
}) {
  const t = await prisma.tender.findUnique({ where: { id: opts.tenderId }, include: { invites: true, bids: true } });
  if (!t || opts.changes.length === 0) return;
  const { version, hash } = await bumpDossier(t.id);
  const postBid = t.bids.length > 0;
  await audit({
    entityType: "Tender",
    entityId: t.id,
    action: "dossier_change",
    actorId: opts.actor.id,
    details: { version, hash, summary: opts.summary, fields: opts.changes.map((c) => c.field), postBid },
  });
  if (postBid) {
    for (const c of opts.changes) {
      await audit({
        entityType: "Tender",
        entityId: t.id,
        action: "post_bid_change",
        actorId: opts.actor.id,
        details: { postBid: true, field: c.field, before: c.before, after: c.after, version, hash, bidsAtChange: t.bids.length },
      });
    }
  }
  const all = await vendorUserIds(t.invites.map((i) => i.vendorId));
  await notifyMany(all, {
    title: `Dossier v${version} — ${t.number}`,
    body: `${opts.actor.name} updated the RFQ dossier: ${opts.summary}`,
    href: `/appels-offres/${t.id}`,
  });
  if (postBid) {
    const bidders = await vendorUserIds(t.bids.map((b) => b.vendorId));
    await notifyMany(bidders, {
      title: `Re-acknowledge required — ${t.number}`,
      body: `Conditions changed after your bid (dossier v${version}). Please review and re-acknowledge.`,
      href: `/appels-offres/${t.id}?tab=brief`,
    });
  }
}

export async function updateBriefing(formData: FormData) {
  const { current } = await requireUser();
  if (current.role === "VENDOR") throw new Error("Not authorized");
  const id = String(formData.get("id"));
  const briefing = String(formData.get("briefing") ?? "");
  const summary = String(formData.get("summary") ?? "").trim() || "Brief update";
  const t = await prisma.tender.findUnique({ where: { id }, include: { invites: true } });
  if (!t) throw new Error("AO introuvable");
  if (t.status === "opened" || t.status === "awarded") throw new Error("RFQ already opened");
  await ensureDossier(t);

  const nnRaw = formData.get("nonNegotiables");
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  const data: { briefing: string; nonNegotiables?: string; deadline?: Date } = { briefing };
  if (nnRaw != null) data.nonNegotiables = serializeConditions(parseConditions(String(nnRaw)));
  if (deadlineRaw) {
    const d = parisLocalToDate(deadlineRaw);
    if (d && toParisLocalInput(d) !== toParisLocalInput(t.deadline)) {
      if (d.getTime() <= Date.now()) throw new Error("New deadline must be in the future");
      data.deadline = d;
    }
  }

  const changes: { field: string; before: string; after: string }[] = [];
  if (stripInternalMarkers(t.briefing) !== stripInternalMarkers(briefing)) {
    changes.push({ field: "Brief", before: stripInternalMarkers(t.briefing), after: stripInternalMarkers(briefing) });
  }
  if (data.nonNegotiables != null && data.nonNegotiables !== t.nonNegotiables) {
    const b = parseConditions(t.nonNegotiables);
    const a = parseConditions(data.nonNegotiables);
    const removed = b.filter((x) => !a.includes(x));
    const added = a.filter((x) => !b.includes(x));
    changes.push({
      field: "Non-negotiable conditions",
      before: removed.length ? removed.join(" | ") : "(none removed)",
      after: added.length ? added.join(" | ") : "(none added)",
    });
  }
  if (data.deadline) {
    changes.push({ field: "Deadline", before: formatParisStamp(t.deadline, "en"), after: formatParisStamp(data.deadline, "en") });
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
    await audit({
      entityType: "Tender",
      entityId: id,
      action: "briefing_edit",
      actorId: current.id,
      details: { summary, conditionsChanged: nnRaw != null },
    });
    await recordDossierChanges({ tenderId: id, actor: current, summary, changes });
  }
  revalidateS2P();
}

/** Supplier asks a question. Never shown with the asker's identity. */
export async function askQuestion(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "VENDOR" || !current.vendorId) throw new Error("Only an invited supplier can ask");
  const tenderId = String(formData.get("tenderId"));
  const question = String(formData.get("question") ?? "").trim();
  if (question.length < 5) throw new Error("Question too short");
  const t = await prisma.tender.findUnique({ where: { id: tenderId }, include: { invites: true } });
  if (!t || !t.invites.some((i) => i.vendorId === current.vendorId)) throw new Error("Not invited");
  if (t.status !== "published" || new Date() > t.deadline) throw new Error("Q&A closed");
  const q = await prisma.tenderQuestion.create({ data: { tenderId, askedByVendorId: current.vendorId, question } });
  await audit({ entityType: "Tender", entityId: tenderId, action: "qa_question", actorId: current.id, details: { questionId: q.id } });
  await notify({
    userId: t.createdById,
    title: `New supplier question — ${t.number}`,
    body: "A supplier asked a question. Your answer will be broadcast to every invited supplier.",
    href: `/appels-offres/${tenderId}?tab=brief`,
  });
  revalidateS2P();
}

/** Buyer answers: broadcast to ALL invited suppliers, bumps the dossier version. */
export async function answerQuestion(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "BUYER") throw new Error("Only the buyer can answer");
  const questionId = String(formData.get("questionId"));
  const answer = String(formData.get("answer") ?? "").trim();
  if (!answer) throw new Error("Answer required");
  const q = await prisma.tenderQuestion.findUnique({ where: { id: questionId }, include: { tender: true } });
  if (!q) throw new Error("Question not found");
  if (q.tender.status === "opened" || q.tender.status === "awarded") throw new Error("RFQ already opened");
  await ensureDossier(q.tender);
  await prisma.tenderQuestion.update({
    where: { id: questionId },
    data: { answer, answeredById: current.id, answeredAt: new Date() },
  });
  await audit({
    entityType: "Tender",
    entityId: q.tenderId,
    action: "qa_answer",
    actorId: current.id,
    details: { question: q.question, answer, previousAnswer: q.answer ?? null },
  });
  await recordDossierChanges({
    tenderId: q.tenderId,
    actor: current,
    summary: q.answer ? "Q&A answer amended" : "Q&A answer published",
    changes: [{ field: "Q&A answer", before: q.answer ?? "(unanswered) " + q.question, after: answer }],
  });
  revalidateS2P();
}

/** Supplier acknowledges the current dossier version. */
export async function acknowledgeDossier(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "VENDOR" || !current.vendorId) throw new Error("Only a supplier can acknowledge");
  const tenderId = String(formData.get("tenderId"));
  const t = await prisma.tender.findUnique({ where: { id: tenderId }, include: { invites: true } });
  if (!t || !t.invites.some((i) => i.vendorId === current.vendorId)) throw new Error("Not invited");
  const { version, hash } = await ensureDossier(t);
  await prisma.dossierReceipt.upsert({
    where: { tenderId_vendorId_version: { tenderId, vendorId: current.vendorId, version } },
    update: { ackAt: new Date() },
    create: { tenderId, vendorId: current.vendorId, version, hash, ackAt: new Date() },
  });
  await audit({ entityType: "Tender", entityId: tenderId, action: "dossier_ack", actorId: current.id, details: { version, hash } });
  revalidateS2P();
}

/** Acheteur : soumet le brouillon au valideur N+1 (avec mots de passe des clés). */
export async function requestValidation(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "BUYER") throw new Error("Seul l'acheteur peut demander la validation");
  const id = String(formData.get("id"));
  const passA = String(formData.get("passA") ?? "");
  const passB = String(formData.get("passB") ?? "");
  if (passA.length < 6 || passB.length < 6) throw new Error("Both passwords must be at least 6 characters");
  const t = await prisma.tender.findUnique({ where: { id } });
  if (!t) throw new Error("AO introuvable");
  if (t.status !== "draft" && t.status !== "pending_validation") throw new Error("Statut incompatible");

  const validatorId = t.validatorId || (await prisma.user.findFirst({ where: { role: "VALIDATOR" } }))?.id;
  if (!validatorId) throw new Error("No N+1 approver");

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
    title: `Approval required — ${t.number}`,
    body: `${current.name} submitted "${t.title}" for N+1 approval before publication.`,
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
  if (t.validatorId && t.validatorId !== current.id) throw new Error("You are not the approver for this RFQ");

  await prisma.tender.update({
    where: { id },
    data: { status: "published", publishedAt: new Date(), validationNote: null },
  });
  const uids = await vendorUserIds(t.invites.map((i) => i.vendorId));
  await notifyMany(uids, {
    title: `New RFQ ${t.number}`,
    body: `${t.title} — submit your bid before the deadline.`,
    href: `/appels-offres/${id}`,
  });
  await notify({
    userId: t.createdById,
    title: `RFQ approved — ${t.number}`,
    body: `${current.name} approved and published the RFQ.`,
    href: `/appels-offres/${id}`,
  });
  await audit({ entityType: "Tender", entityId: id, action: "validation_ok", actorId: current.id });
  const { computeDossier } = await import("@/lib/sealed");
  const hash = await computeDossier(id);
  await prisma.tender.update({ where: { id }, data: { dossierVersion: 1, dossierHash: hash } });
  await audit({ entityType: "Tender", entityId: id, action: "publish", actorId: current.id, details: { dossierVersion: 1, dossierHash: hash } });
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
    title: `RFQ returned — ${t.number}`,
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
    body: `You are invited to respond to: ${t?.title}`,
    href: `/appels-offres/${tenderId}`,
  });
  await audit({ entityType: "Tender", entityId: tenderId, action: "invite", actorId: current.id, details: { vendorId } });
  revalidateS2P();
}

export async function submitBid(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "VENDOR" || !current.vendorId) throw new Error("Only a supplier can submit a bid");
  const tenderId = String(formData.get("tenderId"));
  const t = await prisma.tender.findUnique({ where: { id: tenderId } });
  if (!t) throw new Error("AO introuvable");
  if (new Date() > t.deadline) throw new Error("Deadline passed");
  if (t.status !== "published") throw new Error("AO non ouvert aux offres");

  const items = parseConditions(t.nonNegotiables);
  const ticked = formData.getAll("conditionAccept").map(String);
  const flagged = String(formData.get("conditionsAccepted") ?? "") === "1";
  const accepted =
    items.length === 0 ||
    flagged ||
    (ticked.length === items.length && items.every((it) => ticked.includes(it)));
  if (items.length && !accepted) {
    throw new Error("You must accept all non-negotiable conditions to submit a bid.");
  }
  const acceptedAt = new Date();
  const acceptedConditions = JSON.stringify({
    items,
    acceptedAt: acceptedAt.toISOString(),
  });

  const { version: dossierVersion, hash: dossierHash } = await ensureDossier(t);
  const price = Number(String(formData.get("price")).replace(",", "."));
  const leadTimeDays = Number(formData.get("leadTimeDays"));
  const comments = String(formData.get("comments") ?? "");
  await prisma.bid.upsert({
    where: { tenderId_vendorId: { tenderId, vendorId: current.vendorId } },
    update: {
      payload: sealPayload(JSON.stringify({ price, leadTimeDays, comments })),
      submittedAt: new Date(),
      acceptedConditions,
      dossierVersion,
      dossierHash,
    },
    create: {
      tenderId,
      vendorId: current.vendorId,
      payload: sealPayload(JSON.stringify({ price, leadTimeDays, comments })),
      acceptedConditions,
      dossierVersion,
      dossierHash,
    },
  });
  await prisma.dossierReceipt.upsert({
    where: { tenderId_vendorId_version: { tenderId, vendorId: current.vendorId, version: dossierVersion } },
    update: { ackAt: acceptedAt },
    create: { tenderId, vendorId: current.vendorId, version: dossierVersion, hash: dossierHash, ackAt: acceptedAt },
  });
  await audit({
    entityType: "Tender",
    entityId: tenderId,
    action: "bid_submit",
    actorId: current.id,
    details: { conditionsAcceptedAt: acceptedAt.toISOString(), conditionsCount: items.length, dossierVersion, dossierHash },
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
  if (!t) throw new Error("AO introuvable");
  if (new Date() < t.deadline) throw new Error("Opening not possible before the deadline");

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
  if (!t) throw new Error("AO introuvable");
  if (current.role === "VENDOR") throw new Error("Not authorized");
  if (t.status !== "opened" || !isRevealed(t)) {
    await logSealedDenied(tenderId, current.id, "action:awardBid", "not_opened");
    throw new Error("AO non encore ouvert");
  }
  await prisma.tender.update({ where: { id: tenderId }, data: { status: "awarded", awardedBidId: bidId } });
  const bid = t.bids.find((b) => b.id === bidId);
  await audit({ entityType: "Tender", entityId: tenderId, action: "award", actorId: current.id, details: { bidId } });
  if (bid) {
    const uids = await vendorUserIds([bid.vendorId]);
    await notifyMany(uids, {
      title: `Bid awarded — ${t.number}`,
      body: `Your bid was awarded for “${t.title} ».`,
      href: `/appels-offres/${tenderId}`,
    });
  }
  revalidateS2P();
  redirect(`/appels-offres/${tenderId}?tab=cles`);
}

export async function updateOrgNonNegotiables(formData: FormData) {
  const { current } = await requireUser();
  if (current.role !== "BUYER" && current.role !== "VALIDATOR") {
    throw new Error("Not authorized");
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
