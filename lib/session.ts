import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const USER_COOKIE = "pli_user";

export async function getCurrentUser() {
  const jar = await cookies();
  const id = jar.get(USER_COOKIE)?.value;
  const users = await prisma.user.findMany({
    include: { vendor: true, company: true },
    orderBy: { name: "asc" },
  });
  if (users.length === 0) return null;
  const current =
    users.find((u) => u.id === id) ??
    users.find((u) => u.role === "REQUESTER") ??
    users.find((u) => u.role === "OPENING_A") ??
    users.find((u) => u.role === "BUYER") ??
    users[0];
  return { current, users };
}

export async function requireUser() {
  const ctx = await getCurrentUser();
  if (!ctx) throw new Error("No user — run the seed.");
  return ctx;
}
