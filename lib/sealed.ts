import { prisma } from "./prisma";
import { audit } from "./audit";
import { unsealPayloadUnsafe } from "./seal-crypto";
import { parseConditions } from "./conditions";
import { dossierHash } from "./seal-crypto";

export type BidPayload = { price: number; leadTimeDays: number; comments: string };

export class SealedError extends Error {
  constructor() {
    super("Bids are sealed until the two-key opening");
  }
}

export function isRevealed(t: { status: string; keyAUnlocked: boolean; keyBUnlocked: boolean }) {
  return (t.status === "opened" || t.status === "awarded") && t.keyAUnlocked && t.keyBUnlocked;
}

/** The ONLY way to read bid amounts. Throws before the two-key opening. */
export function revealBids<B extends { payload: string }>(
  t: { status: string; keyAUnlocked: boolean; keyBUnlocked: boolean },
  bids: B[]
): (B & { data: BidPayload })[] {
  if (!isRevealed(t)) throw new SealedError();
  return bids.map((b) => {
    let data: BidPayload = { price: 0, leadTimeDays: 0, comments: "" };
    try {
      data = JSON.parse(unsealPayloadUnsafe(b.payload)) as BidPayload;
    } catch {
      /* corrupt row */
    }
    return { ...b, data };
  });
}

export async function logSealedDenied(tenderId: string, actorId: string, route: string, reason: string) {
  await audit({
    entityType: "Tender",
    entityId: tenderId,
    action: "sealed_access_denied",
    actorId,
    details: { route, reason },
  });
}

export async function computeDossier(tenderId: string) {
  const t = await prisma.tender.findUnique({ where: { id: tenderId }, include: { questions: true } });
  if (!t) throw new Error("RFQ not found");
  return dossierHash({
    number: t.number,
    title: t.title,
    deadline: t.deadline,
    briefing: t.briefing,
    nonNegotiables: parseConditions(t.nonNegotiables),
    qa: t.questions
      .filter((q) => q.answer && q.answeredAt)
      .map((q) => ({ id: q.id, question: q.question, answer: q.answer!, answeredAt: q.answeredAt! })),
  });
}

/** Recompute hash; bump the version when content changed. */
export async function bumpDossier(tenderId: string): Promise<{ version: number; hash: string; changed: boolean }> {
  const t = await prisma.tender.findUnique({ where: { id: tenderId } });
  if (!t) throw new Error("RFQ not found");
  const hash = await computeDossier(tenderId);
  if (hash === t.dossierHash) return { version: t.dossierVersion, hash, changed: false };
  const version = t.dossierHash ? t.dossierVersion + 1 : t.dossierVersion;
  await prisma.tender.update({ where: { id: tenderId }, data: { dossierVersion: version, dossierHash: hash } });
  return { version, hash, changed: true };
}

/** Make sure a tender has a hash (rows created before this feature). */
export async function ensureDossier(t: { id: string; dossierHash: string | null; dossierVersion: number }) {
  if (t.dossierHash) return { version: t.dossierVersion, hash: t.dossierHash };
  const r = await bumpDossier(t.id);
  return { version: r.version, hash: r.hash };
}

/** Record (once per version) that a supplier viewed the dossier. */
export async function recordDossierView(tenderId: string, vendorId: string, actorId: string, version: number, hash: string) {
  const existing = await prisma.dossierReceipt.findUnique({
    where: { tenderId_vendorId_version: { tenderId, vendorId, version } },
  });
  if (existing) return existing;
  const r = await prisma.dossierReceipt.create({ data: { tenderId, vendorId, version, hash } });
  await audit({ entityType: "Tender", entityId: tenderId, action: "dossier_viewed", actorId, details: { version, hash } });
  return r;
}

/** Audit events visible to a supplier: own events + buyer-side dossier events; never other suppliers'. */
export const SUPPLIER_VISIBLE_INTERNAL = new Set([
  "publish",
  "briefing_edit",
  "dossier_change",
  "post_bid_change",
  "qa_answer",
  "deadline_passed",
  "opened",
  "award",
]);
