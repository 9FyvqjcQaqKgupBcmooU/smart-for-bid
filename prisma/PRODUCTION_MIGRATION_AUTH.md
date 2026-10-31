# Production migration plan — auth / MFA / AO roles (auth-mfa)

**Status:** NOT applied to Turso. Requires Alexis approval.

## Schema diff (additive — no deletes)

### New tables
- `Session`, `Account`, `Verification`, `TwoFactor` (Better Auth)
- `Organization`, `Membership`, `OrgInvitation`
- `TenderAssignment` (per-AO roles)
- `MfaStepUp` (10-minute MFA step-up window)

### Altered tables
- `User`: add `emailVerified`, `image`, `updatedAt`, `twoFactorEnabled`; make `companyId` nullable; keep legacy `role`/`title`/`vendorId`
- `Vendor`: optional 1:1 `organization`
- `Tender`: relation `assignments`
- `AuditEvent`: add nullable `orgId`, `aoId`, `ipAddress`, `userAgent`

### Data backfill (idempotent)
Script: `prisma/migrate-auth-additive.ts`
- Creates org **Demo Acheteur** (buyer) if missing
- Creates supplier orgs for existing Vendor rows (NordLog, Sportline, Atelier Lumen, …)
- Memberships for known demo emails (Anna = owner)
- TenderAssignment for AO-2026-0001 keyholders Hugo/Inès + owner Anna
- Existing AOs remain readable; unclaimed until memberships/assignments exist

## SQL sketch (SQLite / LibSQL — illustrative)

```sql
-- Better Auth + org tables created by Prisma migrate/db push from schema.prisma
-- No DROP / DELETE statements in the approved plan.
ALTER TABLE User ADD COLUMN emailVerified BOOLEAN DEFAULT 0;
ALTER TABLE User ADD COLUMN image TEXT;
ALTER TABLE User ADD COLUMN updatedAt DATETIME;
ALTER TABLE User ADD COLUMN twoFactorEnabled BOOLEAN DEFAULT 0;
-- companyId nullability via table rebuild on SQLite if needed
ALTER TABLE AuditEvent ADD COLUMN orgId TEXT;
ALTER TABLE AuditEvent ADD COLUMN aoId TEXT;
ALTER TABLE AuditEvent ADD COLUMN ipAddress TEXT;
ALTER TABLE AuditEvent ADD COLUMN userAgent TEXT;
```

Prefer `prisma migrate deploy` with a reviewed migration folder over hand-written SQL once Alexis approves.

## Vercel env vars (Alexis must set)

| Var | Notes |
|-----|--------|
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` — never commit |
| `BETTER_AUTH_URL` | Production canonical URL |
| `DEMO_ROLE_SWITCH` | `0` or unset |
| Existing `TURSO_*` / `DATABASE_URL` | unchanged |

## What Alexis must approve
1. Additive schema push to Turso (new tables/columns only)
2. Running data backfill (`migrate-auth-additive`) once
3. Setting `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` on Vercel
4. Turning off demo role switch in production
5. Communicating that demo users need password reset / invite acceptance before acting as Client/Supplier

## Explicit non-actions
- No production deploy from branch `auth-mfa` without separate approval
- No merge to `main` from this work alone
- No delete of existing tenders, bids, or users
