"use server";

import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import { audit } from "@/lib/audit";
import {
  assertDistinctKeyholders,
  assertMfaEnrolled,
  hasAoRole,
  requireAoRole,
  type AoRole,
} from "@/lib/authz";
import { revalidatePath } from "next/cache";

export async function assignAoRole(formData: FormData) {
  const { user, twoFactorEnabled } = await requireAuthUser();
  await assertMfaEnrolled(user.id, twoFactorEnabled);
  const tenderId = String(formData.get("tenderId"));
  const targetUserId = String(formData.get("userId"));
  const aoRole = String(formData.get("aoRole")) as AoRole;
  const keySlotRaw = String(formData.get("keySlot") ?? "");
  const keySlot = keySlotRaw === "A" || keySlotRaw === "B" ? keySlotRaw : undefined;

  const canManage =
    (await hasAoRole(user.id, tenderId, ["owner"])) ||
    (await prisma.membership.findFirst({
      where: { userId: user.id, orgRole: { in: ["owner", "admin"] }, org: { type: "buyer" } },
    }));
  if (!canManage) throw new Error("Forbidden: only AO owner or buyer org admin can assign roles");

  if (aoRole === "keyholder") {
    if (!keySlot) throw new Error("keySlot A or B required for keyholder");
    await assertDistinctKeyholders(tenderId, targetUserId, keySlot);
  }

  await prisma.tenderAssignment.upsert({
    where: {
      tenderId_userId_aoRole: { tenderId, userId: targetUserId, aoRole },
    },
    update: { keySlot: keySlot ?? null },
    create: { tenderId, userId: targetUserId, aoRole, keySlot: keySlot ?? null },
  });

  if (aoRole === "keyholder" && keySlot) {
    const data = keySlot === "A" ? { keyAUserId: targetUserId } : { keyBUserId: targetUserId };
    await prisma.tender.update({ where: { id: tenderId }, data });
  }

  await audit({
    entityType: "Tender",
    entityId: tenderId,
    action: "ao_role_assign",
    actorId: user.id,
    aoId: tenderId,
    details: { targetUserId, aoRole, keySlot },
  });
  revalidatePath("/", "layout");
}
