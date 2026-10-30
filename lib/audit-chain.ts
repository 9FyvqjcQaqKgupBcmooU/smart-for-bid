import { createHash } from "crypto";

export type ChainableEvent = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorName: string;
  orgName: string;
  details: string;
  createdAt: Date;
};

export type ChainedEvent = ChainableEvent & {
  prevHash: string;
  hash: string;
};

const GENESIS = "0".repeat(64);

function canonical(ev: ChainableEvent, prevHash: string): string {
  return [
    prevHash,
    ev.id,
    ev.entityType,
    ev.entityId,
    ev.action,
    ev.actorId,
    ev.actorName,
    ev.orgName,
    ev.details ?? "",
    ev.createdAt.toISOString(),
  ].join("|");
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Build hash chain chronologically (oldest → newest). Display newest first. */
export function buildAuditChain(eventsAsc: ChainableEvent[]): ChainedEvent[] {
  let prev = GENESIS;
  const out: ChainedEvent[] = [];
  for (const ev of eventsAsc) {
    const hash = sha256Hex(canonical(ev, prev));
    out.push({ ...ev, prevHash: prev, hash });
    prev = hash;
  }
  return out;
}

export function verifyAuditChain(chain: ChainedEvent[]): { ok: boolean; brokenAt?: string; tipHash: string } {
  let prev = GENESIS;
  for (const ev of chain) {
    if (ev.prevHash !== prev) return { ok: false, brokenAt: ev.id, tipHash: prev };
    const expect = sha256Hex(canonical(ev, prev));
    if (expect !== ev.hash) return { ok: false, brokenAt: ev.id, tipHash: prev };
    prev = ev.hash;
  }
  return { ok: true, tipHash: prev === GENESIS ? GENESIS : prev };
}

/** Seal fingerprint of the sealed offer set (bids sorted by id). */
export function sealFingerprint(bids: { id: string; vendorId: string; submittedAt: Date; payload: string }[]): string {
  const material = bids
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((b) => `${b.id}|${b.vendorId}|${b.submittedAt.toISOString()}|${sha256Hex(b.payload)}`)
    .join("\n");
  return sha256Hex(material || "empty-seal");
}

export function shortHash(h: string): string {
  if (!h || h.length < 12) return h;
  return `${h.slice(0, 4)}…${h.slice(-4)}`;
}

export { GENESIS };
