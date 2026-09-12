import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function prepareDatabase() {
  if (!process.env.VERCEL) return;
  const dest = "/tmp/pli.db";
  if (!existsSync(dest)) {
    const src = path.join(process.cwd(), "prisma", "dev.db");
    if (existsSync(src)) copyFileSync(src, dest);
  }
  process.env.DATABASE_URL = "file:/tmp/pli.db";
}

prepareDatabase();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
