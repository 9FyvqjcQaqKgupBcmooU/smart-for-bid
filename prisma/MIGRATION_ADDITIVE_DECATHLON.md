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
- Clé A : Hugo S.

## Hors scope

- Pas de stockage de fichiers importés (préremplissage éditeur uniquement)
- Pas de reseed Turso dans cette note
