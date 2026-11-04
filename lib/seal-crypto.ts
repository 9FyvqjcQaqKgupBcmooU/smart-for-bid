// Pure helpers (no Prisma import) so the seed script can reuse them.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "sealed:v1:";

function key(): Buffer {
  // Per-environment secret. The fallback is for the fictional demo only — set BID_SEAL_KEY in real envs.
  const secret = process.env.BID_SEAL_KEY || "smart-for-bid-demo-seal-key-v1";
  return createHash("sha256").update(secret, "utf8").digest();
}

export function isSealedPayload(payload: string): boolean {
  return payload.startsWith(PREFIX);
}

/** AES-256-GCM encrypt a bid payload at rest. */
export function sealPayload(plain: string): string {
  if (isSealedPayload(plain)) return plain;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return PREFIX + [iv, tag, ct].map((b) => b.toString("base64")).join(":");
}

/** Decrypt — only call through lib/sealed.ts revealBids(), which enforces the two-key opening. */
export function unsealPayloadUnsafe(payload: string): string {
  if (!isSealedPayload(payload)) return payload; // legacy plaintext rows
  const [iv, tag, ct] = payload.slice(PREFIX.length).split(":").map((x) => Buffer.from(x, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

export function stripInternalMarkers(md: string): string {
  return md.replace(/<!--\s*bid-[\w-]+:[^>]*-->/gi, "").replace(/\n{3,}/g, "\n\n").trim();
}

export type DossierInput = {
  number: string;
  title: string;
  deadline: Date;
  briefing: string;
  nonNegotiables: string[];
  qa: { id: string; question: string; answer: string; answeredAt: Date }[];
};

/** Canonical supplier dossier — exactly what every invited supplier sees (no budget, no counts). */
export function canonicalDossier(d: DossierInput): string {
  return JSON.stringify({
    number: d.number,
    title: d.title,
    deadline: d.deadline.toISOString(),
    briefing: stripInternalMarkers(d.briefing),
    nonNegotiables: d.nonNegotiables,
    qa: d.qa
      .slice()
      .sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime() || a.id.localeCompare(b.id))
      .map((q) => ({ q: q.question, a: q.answer, at: q.answeredAt.toISOString() })),
  });
}

export function dossierHash(d: DossierInput): string {
  return createHash("sha256").update(canonicalDossier(d), "utf8").digest("hex");
}
