import { prisma } from "@/lib/prisma";

export type OrgRole = "owner" | "admin" | "member";
export type AoRole = "owner" | "editor" | "keyholder" | "evaluator" | "viewer" | "bidder";

export const MFA_REQUIRED_ORG_ROLES: OrgRole[] = ["owner", "admin"];
export const MFA_REQUIRED_AO_ROLES: AoRole[] = ["keyholder", "evaluator"];
export const STEP_UP_WINDOW_MS = 10 * 60 * 1000;

export function demoRoleSwitchEnabled() {
  if (process.env.DEMO_ROLE_SWITCH === "1") return true;
  if (process.env.NODE_ENV === "development" && process.env.DEMO_ROLE_SWITCH !== "0") {
    // Spec: off by default; only when DEMO_ROLE_SWITCH=1 OR (NODE_ENV=development AND flag not explicitly 0).
    // User said: "removed unless NODE_ENV=development or a flag DEMO_ROLE_SWITCH=1 (off by default)".
    // Interpret: show when DEMO_ROLE_SWITCH=1, OR when NODE_ENV=development *if* we treat that as the or.
    // "off by default" means DEMO_ROLE_SWITCH defaults off; NODE_ENV=development alone enables it.
    return process.env.NODE_ENV === "development";
  }
  return process.env.DEMO_ROLE_SWITCH === "1";
}

/** Strict reading of the flag: demo switch only when explicitly enabled. */
export function isDemoRoleSwitchOn() {
  return process.env.DEMO_ROLE_SWITCH === "1" || process.env.NODE_ENV === "development";
}

export async function getMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: { org: true },
  });
}

export async function requireOrgRole(userId: string, orgId: string, roles: OrgRole[]) {
  const m = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId } },
  });
  if (!m || !roles.includes(m.orgRole as OrgRole)) {
    throw new Error("Forbidden: organization role required");
  }
  return m;
}

export async function getAoRoles(userId: string, tenderId: string): Promise<AoRole[]> {
  const rows = await prisma.tenderAssignment.findMany({ where: { userId, tenderId } });
  return rows.map((r) => r.aoRole as AoRole);
}

export async function hasAoRole(userId: string, tenderId: string, roles: AoRole[]) {
  const mine = await getAoRoles(userId, tenderId);
  return roles.some((r) => mine.includes(r));
}

export async function requireAoRole(userId: string, tenderId: string, roles: AoRole[]) {
  const ok = await hasAoRole(userId, tenderId, roles);
  if (!ok) throw new Error(`Forbidden: AO role one of [${roles.join(", ")}] required`);
}

export async function userRequiresMfa(userId: string): Promise<boolean> {
  const memberships = await prisma.membership.findMany({ where: { userId } });
  if (memberships.some((m) => MFA_REQUIRED_ORG_ROLES.includes(m.orgRole as OrgRole))) return true;
  const assignments = await prisma.tenderAssignment.findMany({ where: { userId } });
  if (assignments.some((a) => MFA_REQUIRED_AO_ROLES.includes(a.aoRole as AoRole))) return true;
  return false;
}

export async function assertMfaEnrolled(userId: string, twoFactorEnabled: boolean | null | undefined) {
  const needs = await userRequiresMfa(userId);
  if (needs && !twoFactorEnabled) {
    throw new Error("MFA_ENROLLMENT_REQUIRED");
  }
}

export async function recordStepUp(opts: {
  userId: string;
  sessionId: string;
  purpose: string;
}) {
  const expiresAt = new Date(Date.now() + STEP_UP_WINDOW_MS);
  return prisma.mfaStepUp.create({
    data: {
      userId: opts.userId,
      sessionId: opts.sessionId,
      purpose: opts.purpose,
      expiresAt,
    },
  });
}

export async function hasFreshStepUp(userId: string, purpose: string, sessionId?: string) {
  const now = new Date();
  const row = await prisma.mfaStepUp.findFirst({
    where: {
      userId,
      purpose,
      expiresAt: { gt: now },
      ...(sessionId ? { sessionId } : {}),
    },
    orderBy: { verifiedAt: "desc" },
  });
  return !!row;
}

export async function requireFreshStepUp(userId: string, purpose: string, sessionId?: string) {
  const ok = await hasFreshStepUp(userId, purpose, sessionId);
  if (!ok) throw new Error("MFA_STEP_UP_REQUIRED");
}

/** Two distinct people as keyholders; same user cannot hold both slots. */
export async function assertDistinctKeyholders(tenderId: string, userId: string, keySlot: "A" | "B") {
  const other = keySlot === "A" ? "B" : "A";
  const conflict = await prisma.tenderAssignment.findFirst({
    where: { tenderId, userId, aoRole: "keyholder", keySlot: other },
  });
  if (conflict) throw new Error("Same user cannot hold both keyholder slots");
  const occupied = await prisma.tenderAssignment.findFirst({
    where: { tenderId, aoRole: "keyholder", keySlot },
  });
  if (occupied && occupied.userId !== userId) {
    throw new Error(`Key slot ${keySlot} already assigned`);
  }
}
