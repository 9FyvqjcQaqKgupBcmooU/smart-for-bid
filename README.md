# Smart For Bid — sealed-bid RFQs

Sealed-bid RFQs (appels d’offres) for **Helios Distribution**. Dual-key bid opening: two officers must be present. Requisitions, approvals, goods receipt, invoice, and payment are parked.

Default locale is **English**. Language and theme live under **Prefs** (cookie `pli-lang`). Primary actions use the cobalt pill (`#1D4ED8`).

## Run

Requires Node 20+. In the project folder:

1. Install dependencies (`install` via the project package manager)
2. Push the schema: `prisma db push` (script `db:push`)
3. Load data: script `db:seed`
4. Start: script `dev` — port **3000**

Open http://localhost:3000

SQLite database: `prisma/dev.db`. No real accounts: the header has a **role switcher** that impersonates demo users.

## Bid-opening passwords

- Officer A — Hugo Santos: `alpha-ouvre`
- Officer B — Inès Benali: `bravo-ouvre`

## Demo (sealed RFQ)

**AO-2026-0001** — Store furniture framework agreement 2026-2028. Published, deadline passed, 3 sealed bids, addendum 12 Aug (Léa, 46 checkout displays). Not yet unlocked.

1. **Hugo** — home queue shows **Unlock bids**. Enter `alpha-ouvre`.
2. **Inès** — switch to **Inès — Bid officer**, enter `bravo-ouvre`. The three bids appear.
3. **Léa awards** — switch to **Léa — Buyer**. Award a vendor. Status becomes awarded; you stay on the RFQ.

After a run, **Prefs → Reset demo**. Reloads AO-2026-0001 sealed.

## Data

**Helios Distribution SAS**, Lille, SIREN 891 245 667.

Users: Camille Leroy, Thomas Bernard, Nadia El Amrani, Julien Moreau, Claire Petit, Léa Hoffmann, Hugo Santos, Inès Benali, Antoine Girard, portals Sportline SAS, NordLog, Atelier Lumen.

## Stack

Next.js App Router, TypeScript, Tailwind CSS v4, Prisma, SQLite.
