import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function audit(opts: {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  details?: Record<string, unknown>;
  orgId?: string | null;
  aoId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  let ip = opts.ipAddress ?? null;
  let ua = opts.userAgent ?? null;
  if (ip == null || ua == null) {
    try {
      const h = await headers();
      ip = ip ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
      ua = ua ?? h.get("user-agent");
    } catch {
      /* headers() unavailable outside request context */
    }
  }
  return prisma.auditEvent.create({
    data: {
      entityType: opts.entityType,
      entityId: opts.entityId,
      action: opts.action,
      actorId: opts.actorId,
      details: JSON.stringify(opts.details ?? {}),
      orgId: opts.orgId ?? undefined,
      aoId: opts.aoId ?? undefined,
      ipAddress: ip ?? undefined,
      userAgent: ua ?? undefined,
    },
  });
}

export async function notify(opts: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}) {
  return prisma.notification.create({ data: opts });
}

export async function notifyMany(
  userIds: string[],
  opts: { title: string; body: string; href?: string }
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...opts })),
  });
}
