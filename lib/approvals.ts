import { prisma } from "./prisma";

export async function levelsForAmount(amountHT: number): Promise<string[]> {
  const rows = await prisma.approvalThreshold.findMany({ orderBy: { minAmount: "asc" } });
  const match = rows.find((t) => amountHT >= t.minAmount && (t.maxAmount === null || amountHT <= t.maxAmount));
  if (!match) return ["N+1"];
  return JSON.parse(match.levels) as string[];
}

export async function approverForLevel(level: string) {
  const role = ({ "N+1": "N1", "N+2": "N2", "N+3": "N3", "N+4": "N4" } as Record<string, string>)[level] ?? "N1";
  const user = await prisma.user.findFirst({ where: { role } });
  if (!user) throw new Error(`No approver for ${level}`);
  return user;
}

export async function apApprovers() {
  const n1 = await prisma.user.findFirst({ where: { role: "N3" } });
  const n2 = await prisma.user.findFirst({ where: { role: "N4" } });
  if (!n1 || !n2) throw new Error("AP hierarchy incomplete");
  return { n1, n2 };
}
