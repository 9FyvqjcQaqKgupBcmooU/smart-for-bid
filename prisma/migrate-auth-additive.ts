/**
 * Additive migration plan for production Turso (DOCUMENTATION + local dry-run helper).
 *
 * DO NOT run this against production Turso from the auth-mfa worktree.
 * Alexis must approve before any production apply.
 *
 * What it does (additive only — no deletes):
 * 1. Creates Better Auth tables: Session, Account, Verification, TwoFactor
 * 2. Adds User columns: emailVerified, image, updatedAt, twoFactorEnabled; makes companyId nullable
 * 3. Creates Organization, Membership, OrgInvitation, TenderAssignment, MfaStepUp
 * 4. Adds AuditEvent columns: orgId, aoId, ipAddress, userAgent
 * 5. Adds Tender.assignments relation via TenderAssignment table
 * 6. Optionally seeds "Demo Acheteur" + supplier orgs and memberships for existing demo users
 *    (idempotent by org name / membership unique keys). Existing AOs stay readable;
 *    assignments are created for AO-2026-0001 if present.
 *
 * Env required on Vercel (production) after approve:
 *   BETTER_AUTH_SECRET  (random 32+ bytes)
 *   BETTER_AUTH_URL     (https://<production-domain>)
 *   DEMO_ROLE_SWITCH=0  (or unset)
 *
 * Apply locally only:
 *   env -u TURSO_DATABASE_URL -u TURSO_AUTH_TOKEN npx tsx prisma/migrate-auth-additive.ts
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  if (process.env.TURSO_DATABASE_URL || process.env.TURSO_AUTH_TOKEN) {
    console.error("REFUSING: Turso env present. This script is local-SQLite only.");
    process.exit(2);
  }
  const url = process.env.DATABASE_URL || "";
  if (!url.startsWith("file:")) {
    console.error("REFUSING: DATABASE_URL must be file: SQLite");
    process.exit(2);
  }

  const prisma = new PrismaClient();
  try {
    // Schema is applied via `prisma db push` for SQLite locally.
    // This script only performs idempotent data backfill.
    let buyer = await prisma.organization.findFirst({ where: { name: "Demo Acheteur", type: "buyer" } });
    if (!buyer) {
      buyer = await prisma.organization.create({ data: { name: "Demo Acheteur", type: "buyer" } });
      console.log("Created org Demo Acheteur", buyer.id);
    }

    const vendors = await prisma.vendor.findMany();
    for (const v of vendors) {
      const existing = await prisma.organization.findFirst({ where: { vendorId: v.id } });
      if (!existing) {
        await prisma.organization.create({
          data: { name: v.name, type: "supplier", vendorId: v.id },
        });
        console.log("Created supplier org for", v.name);
      }
    }

    const anna = await prisma.user.findFirst({ where: { email: "anna.martin@helios-distribution.fr" } });
    if (anna && buyer) {
      await prisma.membership.upsert({
        where: { userId_orgId: { userId: anna.id, orgId: buyer.id } },
        update: { orgRole: "owner" },
        create: { userId: anna.id, orgId: buyer.id, orgRole: "owner" },
      });
    }

    const featured = await prisma.tender.findFirst({ where: { number: "AO-2026-0001" } });
    if (featured && anna) {
      await prisma.tenderAssignment.upsert({
        where: {
          tenderId_userId_aoRole: { tenderId: featured.id, userId: anna.id, aoRole: "owner" },
        },
        update: {},
        create: { tenderId: featured.id, userId: anna.id, aoRole: "owner" },
      });
      for (const slot of [
        { email: "hugo.santos@helios-distribution.fr", keySlot: "A" },
        { email: "ines.benali@helios-distribution.fr", keySlot: "B" },
      ] as const) {
        const u = await prisma.user.findFirst({ where: { email: slot.email } });
        if (!u) continue;
        await prisma.tenderAssignment.upsert({
          where: {
            tenderId_userId_aoRole: { tenderId: featured.id, userId: u.id, aoRole: "keyholder" },
          },
          update: { keySlot: slot.keySlot },
          create: {
            tenderId: featured.id,
            userId: u.id,
            aoRole: "keyholder",
            keySlot: slot.keySlot,
          },
        });
      }
    }

    console.log("Additive data backfill complete (local).");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
