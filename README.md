# Smart For Bid — sealed-bid RFQs

Sealed-bid RFQs (appels d'offres) for **Decathlon** (démo interne). Dual-key bid opening: two officers must be present. Requisitions, approvals, goods receipt, invoice, and payment are parked.

Default locale is **French**. Language and theme live under **Préférences** (cookie `pli-lang`). Primary actions use the cobalt pill (`#1D4ED8`). Brand identity of the app remains Smart For Bid (cobalt, IBM Plex); the Decathlon logo appears in the chrome for the demo org.

## Run

Requires Node 20+. In the project folder:

1. Install dependencies (`install` via the project package manager)
2. Push the schema: `prisma db push` (script `db:push`)
3. Load data: script `db:seed`
4. Start: script `dev` — port **3000**

Open http://localhost:3000

SQLite database: `prisma/demo.db` (or `dev.db`). No real accounts: the header has a **role switcher** that impersonates demo users (Paule T. acheteuse, Florent G. valideur N+1 / clé B, Hugo S. clé A, portails fournisseurs).

## Bid-opening passwords

- Officer A — Hugo S.: `alpha-ouvre`
- Officer B — Florent G.: `bravo-ouvre`

## Demo (sealed RFQ + validation N+1)

**AO-2026-0001** — Mobilier de magasin — accord-cadre 2026-2028. Publié, échéance passée, 3 plis scellés, addendum 12 août (Paule T.). Pas encore ouvert.

**AO-2026-0003** — Signalétique magasins — pilote 12 sites. **En attente de validation** (Paule → Florent G.).

Workflow AO :

1. **Paule T.** crée un brouillon, saisit les clés, soumet à validation → statut *En attente de validation*.
2. **Florent G.** (valideur N+1) valide et publie auprès des fournisseurs, ou renvoie avec commentaire.
3. **Hugo S.** / **Florent G.** ouvrent les plis à deux clés après échéance.
4. **Paule T.** attribue.

After a run, **Préférences → Reset demo**. Reloads the seed including AO-0003 pending validation.

## Data

**Decathlon**, Lille (démo fictive). Emails `@decathlon.com`.

Users: Camille L., Thomas B., Nadia E., Julien M., Claire P., **Paule T.** (acheteur), **Hugo S.** (ouverture A), **Florent G.** (valideur N+1 / ouverture B), Antoine G., portails Sportline SAS, NordLog, Atelier Lumen.

Conditions non négociables de démo Decathlon (facture PDF, n° de commande, 45 jours, charte compliance / anticorruption, assurance RC pro…).

## Stack

Next.js App Router, TypeScript, Tailwind CSS v4, Prisma, SQLite.
