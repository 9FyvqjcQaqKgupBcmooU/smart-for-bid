"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { USER_COOKIE } from "@/lib/session";

export async function switchUser(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  const jar = await cookies();
  jar.set(USER_COOKIE, id, { path: "/", httpOnly: false, sameSite: "lax" });
  revalidatePath("/", "layout");
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
    redirect(next);
  }
}

export async function markNotificationRead(id: string) {
  const { prisma } = await import("@/lib/prisma");
  await prisma.notification.update({ where: { id }, data: { read: true } });
  revalidatePath("/", "layout");
}

export async function markAllRead() {
  const { requireUser } = await import("@/lib/session");
  const { prisma } = await import("@/lib/prisma");
  const { current } = await requireUser();
  await prisma.notification.updateMany({ where: { userId: current.id, read: false }, data: { read: true } });
  revalidatePath("/", "layout");
}
