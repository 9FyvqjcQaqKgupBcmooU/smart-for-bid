# Migration additive — Decathlon demo / conditions / validation N+1

À faire valider avant application en production (Turso). **Ne pas exécuter ici.**

## Changements schéma (additifs uniquement)

- `Company.nonNegotiables` String default `"[]"` — JSON des conditions org
- `Tender.nonNegotiables` String default `"[]"`
- `Tender.validatorId` String? + relation `TenderValidator`
- `Tender.validationNote` String?
- `TenderVersion.nonNegotiables` String default `"[]"`
- `Bid.acceptedConditions` String? — JSON `{ items, acceptedAt }`

## Statuts AO

- Nouveau statut applicatif : `pending_validation` (pas d’enum Prisma)

## Workflow

1. Acheteur crée un brouillon (`draft`)
2. « Soumettre à validation » → `pending_validation` (clés A/B hashées)
3. Valideur N+1 (`VALIDATOR`) : « Valider et publier » → `published` + notify fournisseurs
   ou « Renvoyer » → `draft` + `validationNote`

## Données démo

- Organisation : Decathlon
- Acheteuse : Paule T. (`paule.t@decathlon.com`)
- Valideur / clé B : Florent G. (`florent.g@decathlon.com`)
- Clé A : Claire A.

## Hors scope

- Pas de stockage de fichiers importés (préremplissage éditeur uniquement)
- Pas de reseed Turso dans cette note

## 2026-11-04 — Anti-fuite interne V1 (additif)

Ajouts uniquement, aucune colonne supprimée ni renommée :

- `Tender.dossierVersion INTEGER NOT NULL DEFAULT 1`, `Tender.dossierHash TEXT NULL`
- `Bid.dossierVersion INTEGER NULL`, `Bid.dossierHash TEXT NULL` (version du dossier contre laquelle l'offre a été déposée)
- Table `TenderQuestion` (Q&R diffusées à tous, demandeur anonymisé) : `id, tenderId → Tender (cascade), askedByVendorId, question, answer?, answeredById?, askedAt, answeredAt?`
- Table `DossierReceipt` (consultation / accusé de réception par fournisseur et par version) : `id, tenderId, vendorId, version, hash, viewedAt, ackAt?`, unique `(tenderId, vendorId, version)`

Comportement :

- Hash dossier = SHA-256 du JSON canonique (n°, titre, échéance, brief sans marqueurs internes, conditions, Q&R répondues). Toute modification incrémente la version, est chaînée dans l'audit (`dossier_change`) et notifie tous les fournisseurs invités.
- Après la première offre : un événement `post_bid_change` par champ (avant/après, auteur, horodatage, version, hash) ; les soumissionnaires doivent ré-accuser réception.
- `Bid.payload` est chiffré au repos (AES-256-GCM, préfixe `sealed:v1:`), clé `BID_SEAL_KEY` (repli démo si absente). Les anciens payloads en clair restent lisibles. Déchiffrement uniquement via `revealBids` après ouverture à deux clés.
- Tentatives d'accès aux données scellées journalisées (`sealed_access_denied`). Nouvelle route `GET /appels-offres/[id]/bids.json` : 403 fournisseur, 423 avant ouverture.

Prod Turso : **non migrée**. À appliquer avec `prisma db push` (additif) après décision ; définir `BID_SEAL_KEY` (32 octets, base64) par environnement avant tout dépôt réel. Les payloads existants en clair ne sont pas rechiffrés automatiquement.
