import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function stripQuotes(v: string | undefined) {
  if (!v) return v;
  return v.replace(/^["']|["']$/g, "");
}

function makeClient() {
  const tursoUrl = stripQuotes(process.env.TURSO_DATABASE_URL);
  const authToken = stripQuotes(process.env.TURSO_AUTH_TOKEN);

  if (tursoUrl && authToken) {
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken,
    });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
