import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; demoReady?: boolean };

function stripQuotes(v: string | undefined) {
  if (!v) return v;
  return v.replace(/^["']|["']$/g, "");
}

/** Preview / local demo: prefer bundled SQLite and never touch Turso. */
export function preferDemoDb() {
  return process.env.BID_DEMO_DB === "1" || process.env.BID_DEMO_DB === "true";
}

function ensureDemoDb(): string {
  const target = process.env.BID_DEMO_DB_PATH || "/tmp/bid-demo.db";
  if (!globalForPrisma.demoReady) {
    const bundled = path.join(process.cwd(), "prisma", "demo.db");
    try {
      if (fs.existsSync(bundled)) {
        fs.copyFileSync(bundled, target);
      }
    } catch {
      // cold-start race: ignore if already copied
    }
    globalForPrisma.demoReady = true;
  }
  process.env.DATABASE_URL = `file:${target}`;
  // Ensure Turso is not used even if platform env injects it
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
  return `file:${target}`;
}

function makeClient() {
  if (preferDemoDb()) {
    ensureDemoDb();
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

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
