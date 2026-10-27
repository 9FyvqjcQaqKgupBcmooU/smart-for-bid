"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { USER_COOKIE } from "@/lib/session";
import { isDemoRoleSwitchOn } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

export async function switchUser(formData: FormData) {
  if (!isDemoRoleSwitchOn()) {
    throw new Error("Demo role switch is disabled");
  }
  const id = String(formData.get("userId") ?? "");
  const jar = await cookies();
  jar.set(USER_COOKIE, id, { path: "/", httpOnly: true, sameSite: "lax" });
  const me = await getSessionUser();
  if (me) {
    await audit({
      entityType: "Auth",
      entityId: id,
      action: "demo_role_switch",
      actorId: me.user.id,
      details: { targetUserId: id },
    });
  }
  revalidatePath("/", "layout");
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
    redirect(next);
  }
}

export async function markNotificationRead(id: string) {
  const { prisma } = await import("@/lib/prisma");
  const me = await getSessionUser();
  if (!me) throw new Error("Unauthorized");
  await prisma.notification.update({ where: { id }, data: { read: true } });
  revalidatePath("/", "layout");
}

export async function markAllRead() {
  const { prisma } = await import("@/lib/prisma");
  const me = await getSessionUser();
  if (!me) throw new Error("Unauthorized");
  await prisma.notification.updateMany({
    where: { userId: me.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/", "layout");
}
