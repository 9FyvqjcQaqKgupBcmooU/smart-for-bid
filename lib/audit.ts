import { prisma } from "./prisma";

export async function audit(opts: {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  details?: Record<string, unknown>;
}) {
  return prisma.auditEvent.create({
    data: {
      entityType: opts.entityType,
      entityId: opts.entityId,
      action: opts.action,
      actorId: opts.actorId,
      details: JSON.stringify(opts.details ?? {}),
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
