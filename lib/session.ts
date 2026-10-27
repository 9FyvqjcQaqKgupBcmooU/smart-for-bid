import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoRoleSwitchOn } from "@/lib/authz";

/** @deprecated Demo cookie — only used when demo role switch is on */
export const USER_COOKIE = "pli_user";

async function loadUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { vendor: true, company: true, memberships: { include: { org: true } } },
  });
}

export async function getSessionUser() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return null;
  const user = await loadUserById(session.user.id);
  if (!user) return null;
  return {
    session,
    user,
    twoFactorEnabled:
      !!(session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled || user.twoFactorEnabled,
  };
}

export async function getCurrentUser() {
  const ctx = await getSessionUser();
  if (!ctx) return null;

  let current = ctx.user;
  if (isDemoRoleSwitchOn()) {
    const jar = await cookies();
    const demoId = jar.get(USER_COOKIE)?.value;
    if (demoId) {
      const demoUser = await loadUserById(demoId);
      if (demoUser) current = demoUser;
    }
  }

  const users = isDemoRoleSwitchOn()
    ? await prisma.user.findMany({
        include: { vendor: true, company: true, memberships: { include: { org: true } } },
        orderBy: { name: "asc" },
      })
    : [current];

  return {
    current,
    users,
    session: ctx.session,
    twoFactorEnabled: ctx.twoFactorEnabled,
    realUser: ctx.user,
  };
}

export async function requireUser() {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/sign-in");
  return ctx;
}

export async function requireAuthUser() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/sign-in");
  return ctx;
}
