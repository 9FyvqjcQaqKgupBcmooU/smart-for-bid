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
  // Demo default: Client (BUYER) so the first viewport is the live furniture RFQ.
  const current =
    users.find((u) => u.id === id) ??
    users.find((u) => u.role === "BUYER") ??
    users.find((u) => u.role === "OPENING_A") ??
    users.find((u) => u.role === "VENDOR") ??
    users[0];
  return { current, users };
}

export async function requireUser() {
  const ctx = await getCurrentUser();
  if (!ctx) throw new Error("No user — run the seed.");
  return ctx;
}
