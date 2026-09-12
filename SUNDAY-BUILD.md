# Sunday 7 Sep — build path (do not publish from this machine)

Next.js + Prisma + SQLite is **not** a Netlify Drop. Drop needs a static folder; this app has server actions and a database.

When Alexis sends a GitHub repo URL (or a Netlify/Vercel project):

1. Point Prisma at a free hosted DB: **Turso** (libSQL, closest to SQLite) or **Neon** (Postgres — needs a schema provider change).
2. Set `DATABASE_URL` (and Turso `TURSO_AUTH_TOKEN` if Turso) on the host. Run `prisma db push` then `db:seed` once.
3. Build with `next build` on **Vercel Hobby** or **Netlify Next runtime** — not drag-and-drop.
4. No paid add-ons. Do not push from this computer until he gives the URL.
5. Until then: demo stays at http://localhost:3000 — RFQ-only, dual-key AO-2026-0001.
