import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedDemo(prisma: PrismaClient) {
  await prisma.paymentItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.accrual.deleteMany();
  await prisma.gRLine.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.pOLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.requisition.deleteMany();
  await prisma.tenderOpening.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.tenderVersion.deleteMany();
  await prisma.tenderInvite.deleteMany();
  await prisma.tender.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.chartOfAccount.deleteMany();
  await prisma.approvalThreshold.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: "Helios Distribution",
      legalName: "Helios Distribution SAS",
      siren: "891 245 667",
      address: "42 avenue de la Marne",
      city: "Lille",
      zip: "59000",
      country: "FR",
    },
  });

  const sportline = await prisma.vendor.create({
    data: {
      name: "Sportline SAS",
      legalName: "Sportline SAS",
      siren: "443 218 901",
      iban: "FR76 3000 6000 0112 3456 7890 189",
      email: "facturation@sportline.fr",
      city: "Roubaix",
      category: "Sports equipment",
    },
  });
  const nordlog = await prisma.vendor.create({
    data: {
      name: "NordLog",
      legalName: "NordLog Services SAS",
      siren: "512 776 334",
      iban: "FR76 3000 4000 0412 0001 3344 512",
      email: "ops@nordlog.fr",
      city: "Dunkerque",
      category: "Logistics & site services",
    },
  });
  const lumen = await prisma.vendor.create({
    data: {
      name: "Atelier Lumen",
      legalName: "Atelier Lumen SARL",
      siren: "809 112 445",
      iban: "FR76 1470 6000 1112 3344 5566 789",
      email: "hello@atelier-lumen.fr",
      city: "Tourcoing",
      category: "Lighting & fit-out",
    },
  });

  const camille = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Camille Leroy",
      email: "camille.leroy@helios-distribution.fr",
      role: "REQUESTER",
      title: "Requester — store purchasing",
    },
  });
  const thomas = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Thomas Bernard",
      email: "thomas.bernard@helios-distribution.fr",
      role: "N1",
      title: "Store manager — Lille Fives",
    },
  });
  const nadia = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Nadia El Amrani",
      email: "nadia.elamrani@helios-distribution.fr",
      role: "N2",
      title: "Regional director Hauts-de-France",
    },
  });
  const julien = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Julien Moreau",
      email: "julien.moreau@helios-distribution.fr",
      role: "N3",
      title: "Country finance director",
    },
  });
  const claire = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Claire Petit",
      email: "claire.petit@helios-distribution.fr",
      role: "N4",
      title: "Group CFO",
    },
  });
  const lea = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Léa Hoffmann",
      email: "lea.hoffmann@helios-distribution.fr",
      role: "BUYER",
      title: "Buyer — equipment & services",
    },
  });
  const hugo = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Hugo Martin",
      email: "hugo.martin@helios-distribution.fr",
      role: "OPENING_A",
      title: "Officier d'ouverture A",
    },
  });
  const ines = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Inès Duval",
      email: "ines.duval@helios-distribution.fr",
      role: "OPENING_B",
      title: "Officière d'ouverture B",
    },
  });
  const antoine = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Antoine Girard",
      email: "antoine.girard@helios-distribution.fr",
      role: "AP",
      title: "Accounts payable",
    },
  });
  const uSportline = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Sportline SAS",
      email: "portail@sportline.fr",
      role: "VENDOR",
      title: "Vendor portal",
      vendorId: sportline.id,
    },
  });
  const uNordlog = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "NordLog",
      email: "portail@nordlog.fr",
      role: "VENDOR",
      title: "Vendor portal",
      vendorId: nordlog.id,
    },
  });
  const uLumen = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Atelier Lumen",
      email: "portail@atelier-lumen.fr",
      role: "VENDOR",
      title: "Vendor portal",
      vendorId: lumen.id,
    },
  });

  await prisma.approvalThreshold.createMany({
    data: [
      { minAmount: 0, maxAmount: 999.99, levels: JSON.stringify(["N+1"]), label: "Below €1,000 excl. VAT — N+1 only" },
      { minAmount: 1000, maxAmount: 9999.99, levels: JSON.stringify(["N+1", "N+2"]), label: "€1,000 – €9,999 excl. VAT — N+1 then N+2" },
      { minAmount: 10000, maxAmount: 49999.99, levels: JSON.stringify(["N+1", "N+2", "N+3"]), label: "€10,000 – €49,999 excl. VAT — up to N+3" },
      { minAmount: 50000, maxAmount: null, levels: JSON.stringify(["N+1", "N+2", "N+3", "N+4"]), label: "≥ €50,000 excl. VAT — up to N+4 (CFO)" },
    ],
  });

  const accounts = [
    { code: "401", label: "Vendors", type: "liability" },
    { code: "408", label: "Vendors — invoices not received (GR/IR)", type: "liability" },
    { code: "44566", label: "Deductible VAT on goods and services", type: "tax" },
    { code: "44571", label: "Output VAT", type: "tax" },
    { code: "442", label: "State — withholding tax (WHT)", type: "tax" },
    { code: "512", label: "Banks", type: "asset" },
    { code: "606", label: "Non-stock purchases of materials and supplies", type: "expense" },
    { code: "607", label: "Merchandise purchases", type: "expense" },
    { code: "611", label: "General subcontracting", type: "expense" },
    { code: "613", label: "Rent", type: "expense" },
    { code: "615", label: "Maintenance and repairs", type: "expense" },
    { code: "622", label: "Fees and commissions", type: "expense" },
    { code: "624", label: "Freight and staff transport", type: "expense" },
    { code: "626", label: "Postage and telecommunications", type: "expense" },
  ];
  await prisma.chartOfAccount.createMany({ data: accounts });
  const gl = Object.fromEntries(
    (await prisma.chartOfAccount.findMany()).map((a) => [a.code, a])
  );

  const hashA = await bcrypt.hash("alpha-ouvre", 10);
  const hashB = await bcrypt.hash("bravo-ouvre", 10);

  const budget = (n: number) => `\n\n<!--bid-budget:${n}-->`;

  const briefingMobilier = `# AO — Mobilier de magasin 2026-2028

Helios Distribution consulte pour un **accord-cadre national** de fourniture et pose de mobilier de vente (gondoles, têtes de gondole, meubles de caisse).

## Périmètre
- 38 magasins en France, déploiement par vagues
- Durée : 24 mois fermes + 12 mois reconductibles
- Pose hors dimanche, créneau 21 h – 6 h

## Attendus
- Catalogue chiffré HT, livraison franco entrepôt Lille
- Délai de réassort ≤ 12 jours ouvrés
- Garantie pièces et main-d'œuvre 5 ans

Déposez une offre unique : montant global année 1, délai standard, capacité de pose.` + budget(210000);

  const briefingTransport = `# AO — Charte transport régional — rentrée 2026

Besoin d'un **transporteur unique** pour les flux entrepôt Lille → magasins Hauts-de-France (saison de rentrée).

## Volumes
- 18 tournées / semaine, 7,5 t à 12 t
- Fenêtres magasin 6 h – 11 h
- Palettes EUR, gerbage 1,80 m

## Attendus
- Prix au km chargé + minimum de tournée
- Plan de continuité (grève, météo)
- Reporting POD J+1` + budget(48000);

  const briefingDraft = `# AO — Signalétique magasins (brouillon)

Refonte de la signalétique intérieure pour 12 magasins pilotes. Brief en cours de rédaction avec le marketing.` + budget(32000);

  const briefingEclairage = `# AO — Éclairage LED entrepôt Lomme

Remplacement de 84 luminaires LED (4000 K) dans l'entrepôt de Lomme, pose de nuit.` + budget(56000);

  const briefingNettoyage = `# AO — Prestations de nettoyage sites

Nettoyage multi-sites (entrepôt + 6 magasins) — contrat 12 mois.` + budget(78000);

  const briefingIT = `# AO — Postes de travail acheteurs

Renouvellement de 24 postes portables + docking pour l'équipe achats.` + budget(42000);

  // Clos / scellé — échéance récente, prêt à ouvrir (pas d'étiquette « en retard » dans l'UI)
  const tenderClosed = await prisma.tender.create({
    data: {
      number: "AO-2026-0001",
      title: "Mobilier de magasin — accord-cadre 2026-2028",
      briefing: briefingMobilier,
      status: "published",
      deadline: new Date("2026-10-28T17:00:00+01:00"),
      currency: "EUR",
      createdById: lea.id,
      keyAUserId: hugo.id,
      keyBUserId: ines.id,
      keyAHash: hashA,
      keyBHash: hashB,
      keyAUnlocked: false,
      keyBUnlocked: false,
      publishedAt: new Date("2026-10-06T09:30:00+02:00"),
      createdAt: new Date("2026-10-03T14:10:00+02:00"),
    },
  });

  await prisma.tenderInvite.createMany({
    data: [
      { tenderId: tenderClosed.id, vendorId: sportline.id, notifiedAt: new Date("2026-10-06T09:31:00+02:00") },
      { tenderId: tenderClosed.id, vendorId: nordlog.id, notifiedAt: new Date("2026-10-06T09:31:00+02:00") },
      { tenderId: tenderClosed.id, vendorId: lumen.id, notifiedAt: new Date("2026-10-06T09:31:00+02:00") },
    ],
  });

  await prisma.tenderVersion.create({
    data: {
      tenderId: tenderClosed.id,
      changedById: lea.id,
      summary: "Précision périmètre : 46 meubles de caisse au lieu de 38.",
      briefing: briefingMobilier,
      createdAt: new Date("2026-10-14T11:05:00+02:00"),
    },
  });

  await prisma.bid.createMany({
    data: [
      {
        tenderId: tenderClosed.id,
        vendorId: sportline.id,
        payload: JSON.stringify({
          price: 186400,
          leadTimeDays: 14,
          comments: "Pose par équipes internes formées. Maintenance annuelle optionnelle +2,4 %.",
        }),
        submittedAt: new Date("2026-10-24T16:42:00+02:00"),
      },
      {
        tenderId: tenderClosed.id,
        vendorId: nordlog.id,
        payload: JSON.stringify({
          price: 174900,
          leadTimeDays: 18,
          comments: "Sous-traitance de pose certifiée. Capacité 6 magasins / mois.",
        }),
        submittedAt: new Date("2026-10-26T10:15:00+02:00"),
      },
      {
        tenderId: tenderClosed.id,
        vendorId: lumen.id,
        payload: JSON.stringify({
          price: 191250,
          leadTimeDays: 10,
          comments: "Fabrication Tourcoing, bois PEFC. Délai court sur le lot caisse.",
        }),
        submittedAt: new Date("2026-10-27T21:03:00+02:00"),
      },
    ],
  });

  // Publié — échéance future
  const tenderOpen = await prisma.tender.create({
    data: {
      number: "AO-2026-0002",
      title: "Charte transport régional — rentrée 2026",
      briefing: briefingTransport,
      status: "published",
      deadline: new Date("2026-11-18T12:00:00+01:00"),
      currency: "EUR",
      createdById: lea.id,
      keyAUserId: hugo.id,
      keyBUserId: ines.id,
      keyAHash: hashA,
      keyBHash: hashB,
      publishedAt: new Date("2026-10-20T08:00:00+02:00"),
      createdAt: new Date("2026-10-18T10:00:00+02:00"),
    },
  });

  await prisma.tenderInvite.createMany({
    data: [
      { tenderId: tenderOpen.id, vendorId: nordlog.id, notifiedAt: new Date("2026-10-20T08:01:00+02:00") },
      { tenderId: tenderOpen.id, vendorId: sportline.id, notifiedAt: new Date("2026-10-20T08:01:00+02:00") },
    ],
  });

  await prisma.bid.create({
    data: {
      tenderId: tenderOpen.id,
      vendorId: nordlog.id,
      payload: JSON.stringify({
        price: 42800,
        leadTimeDays: 2,
        comments: "Flotte dédiée de 4 camions. Astreinte samedi matin.",
      }),
      submittedAt: new Date("2026-10-27T09:12:00+02:00"),
    },
  });

  // Brouillon
  const tenderDraft = await prisma.tender.create({
    data: {
      number: "AO-2026-0003",
      title: "Signalétique magasins — pilote 12 sites",
      briefing: briefingDraft,
      status: "draft",
      deadline: new Date("2026-12-05T17:00:00+01:00"),
      currency: "EUR",
      createdById: lea.id,
      keyAUserId: hugo.id,
      keyBUserId: ines.id,
      createdAt: new Date("2026-10-28T15:20:00+01:00"),
    },
  });

  // Publié sans offre encore
  const tenderPub2 = await prisma.tender.create({
    data: {
      number: "AO-2026-0004",
      title: "Éclairage LED entrepôt Lomme",
      briefing: briefingEclairage,
      status: "published",
      deadline: new Date("2026-11-28T17:00:00+01:00"),
      currency: "EUR",
      createdById: lea.id,
      keyAUserId: hugo.id,
      keyBUserId: ines.id,
      keyAHash: hashA,
      keyBHash: hashB,
      publishedAt: new Date("2026-10-25T09:00:00+02:00"),
      createdAt: new Date("2026-10-22T11:00:00+02:00"),
    },
  });
  await prisma.tenderInvite.createMany({
    data: [
      { tenderId: tenderPub2.id, vendorId: lumen.id, notifiedAt: new Date("2026-10-25T09:01:00+02:00") },
      { tenderId: tenderPub2.id, vendorId: nordlog.id, notifiedAt: new Date("2026-10-25T09:01:00+02:00") },
    ],
  });

  // Ouvert (cérémonie faite)
  const tenderOpened = await prisma.tender.create({
    data: {
      number: "AO-2026-0005",
      title: "Nettoyage multi-sites — contrat annuel",
      briefing: briefingNettoyage,
      status: "opened",
      deadline: new Date("2026-10-15T17:00:00+02:00"),
      currency: "EUR",
      createdById: lea.id,
      keyAUserId: hugo.id,
      keyBUserId: ines.id,
      keyAHash: hashA,
      keyBHash: hashB,
      keyAUnlocked: true,
      keyBUnlocked: true,
      publishedAt: new Date("2026-09-20T09:00:00+02:00"),
      openedAt: new Date("2026-10-16T10:05:00+02:00"),
      createdAt: new Date("2026-09-18T14:00:00+02:00"),
    },
  });
  await prisma.tenderInvite.createMany({
    data: [
      { tenderId: tenderOpened.id, vendorId: nordlog.id, notifiedAt: new Date("2026-09-20T09:01:00+02:00") },
      { tenderId: tenderOpened.id, vendorId: sportline.id, notifiedAt: new Date("2026-09-20T09:01:00+02:00") },
    ],
  });
  const bidOpenedA = await prisma.bid.create({
    data: {
      tenderId: tenderOpened.id,
      vendorId: nordlog.id,
      payload: JSON.stringify({ price: 71200, leadTimeDays: 5, comments: "Équipes dédiées sites Nord." }),
      submittedAt: new Date("2026-10-12T11:00:00+02:00"),
    },
  });
  await prisma.bid.create({
    data: {
      tenderId: tenderOpened.id,
      vendorId: sportline.id,
      payload: JSON.stringify({ price: 74500, leadTimeDays: 7, comments: "Option produits écolabel." }),
      submittedAt: new Date("2026-10-14T16:20:00+02:00"),
    },
  });
  await prisma.tenderOpening.createMany({
    data: [
      { tenderId: tenderOpened.id, officerId: hugo.id, lock: "A", success: true, createdAt: new Date("2026-10-16T09:58:00+02:00") },
      { tenderId: tenderOpened.id, officerId: ines.id, lock: "B", success: true, createdAt: new Date("2026-10-16T10:05:00+02:00") },
    ],
  });

  // Attribué
  const tenderAwarded = await prisma.tender.create({
    data: {
      number: "AO-2026-0006",
      title: "Postes de travail équipe achats",
      briefing: briefingIT,
      status: "awarded",
      deadline: new Date("2026-09-30T17:00:00+02:00"),
      currency: "EUR",
      createdById: lea.id,
      keyAUserId: hugo.id,
      keyBUserId: ines.id,
      keyAHash: hashA,
      keyBHash: hashB,
      keyAUnlocked: true,
      keyBUnlocked: true,
      publishedAt: new Date("2026-09-05T09:00:00+02:00"),
      openedAt: new Date("2026-10-01T11:20:00+02:00"),
      createdAt: new Date("2026-09-01T10:00:00+02:00"),
    },
  });
  await prisma.tenderInvite.createMany({
    data: [
      { tenderId: tenderAwarded.id, vendorId: lumen.id, notifiedAt: new Date("2026-09-05T09:01:00+02:00") },
      { tenderId: tenderAwarded.id, vendorId: sportline.id, notifiedAt: new Date("2026-09-05T09:01:00+02:00") },
    ],
  });
  const bidAward = await prisma.bid.create({
    data: {
      tenderId: tenderAwarded.id,
      vendorId: lumen.id,
      payload: JSON.stringify({ price: 38400, leadTimeDays: 12, comments: "Garantie constructeur 3 ans." }),
      submittedAt: new Date("2026-09-22T14:00:00+02:00"),
    },
  });
  await prisma.bid.create({
    data: {
      tenderId: tenderAwarded.id,
      vendorId: sportline.id,
      payload: JSON.stringify({ price: 40100, leadTimeDays: 10, comments: "Livraison Lille incluse." }),
      submittedAt: new Date("2026-09-28T09:30:00+02:00"),
    },
  });
  await prisma.tender.update({
    where: { id: tenderAwarded.id },
    data: { awardedBidId: bidAward.id },
  });
  await prisma.tenderOpening.createMany({
    data: [
      { tenderId: tenderAwarded.id, officerId: hugo.id, lock: "A", success: true, createdAt: new Date("2026-10-01T11:12:00+02:00") },
      { tenderId: tenderAwarded.id, officerId: ines.id, lock: "B", success: true, createdAt: new Date("2026-10-01T11:20:00+02:00") },
    ],
  });

  // silence unused draft id for TS (referenced via DB)
  void tenderDraft;
  void bidOpenedA;

  // 3. DA pending N+2 — Rayonnage Lille 18 400 €
  const daRayonnage = await prisma.requisition.create({
    data: {
      number: "DA-2026-0003",
      title: "Lille warehouse racking",
      description:
        "Replacement of 12 pallet-racking bays (900 kg loads) in aisle E of the Lille-Lomme warehouse, following the 2 August safety audit. Supply + assembly, civil works excluded. Indicative quote from Atelier Lumen €18,400 excl. VAT.",
      type: "ONE_OFF",
      amountHT: 18400,
      costCenter: "ENT-LIL-01",
      neededBy: new Date("2026-09-15"),
      status: "pending",
      requesterId: camille.id,
      submittedAt: new Date("2026-08-18T09:20:00+02:00"),
      createdAt: new Date("2026-08-17T16:40:00+02:00"),
    },
  });
  await prisma.approvalStep.createMany({
    data: [
      {
        requisitionId: daRayonnage.id,
        level: "N+1",
        approverId: thomas.id,
        status: "approved",
        decidedAt: new Date("2026-08-18T14:05:00+02:00"),
        comment: "Safety priority. Schedule assembly outside back-to-school flows.",
        stepOrder: 1,
      },
      {
        requisitionId: daRayonnage.id,
        level: "N+2",
        approverId: nadia.id,
        status: "pending",
        stepOrder: 2,
      },
      {
        requisitionId: daRayonnage.id,
        level: "N+3",
        approverId: julien.id,
        status: "waiting",
        stepOrder: 3,
      },
    ],
  });

  // 4. DA approved → PO Sportline, partial GR, accrual open
  const daBallons = await prisma.requisition.create({
    data: {
      number: "DA-2026-0001",
      title: "Balls and accessories — summer season",
      description:
        "Replenishment for Lille Fives store and club corner: size 5 balls, bibs, cones. Combined Sportline order, free delivery to warehouse.",
      type: "ONE_OFF",
      amountHT: 4200,
      costCenter: "MAG-LIL-05",
      neededBy: new Date("2026-08-25"),
      status: "ordered",
      requesterId: camille.id,
      submittedAt: new Date("2026-08-05T10:00:00+02:00"),
      createdAt: new Date("2026-08-05T09:10:00+02:00"),
    },
  });
  await prisma.approvalStep.createMany({
    data: [
      {
        requisitionId: daBallons.id,
        level: "N+1",
        approverId: thomas.id,
        status: "approved",
        decidedAt: new Date("2026-08-05T11:30:00+02:00"),
        comment: "OK for back-to-school replenishment.",
        stepOrder: 1,
      },
      {
        requisitionId: daBallons.id,
        level: "N+2",
        approverId: nadia.id,
        status: "approved",
        decidedAt: new Date("2026-08-05T16:00:00+02:00"),
        comment: "Category budget respected.",
        stepOrder: 2,
      },
    ],
  });
  const poBallons = await prisma.purchaseOrder.create({
    data: {
      number: "BC-2026-0001",
      requisitionId: daBallons.id,
      vendorId: sportline.id,
      terms: "Free delivery to Lille warehouse. Payment 30 days from invoice date. 48h reserve on receipt.",
      status: "partially_received",
      issuedAt: new Date("2026-08-06T09:00:00+02:00"),
      issuedById: lea.id,
      lines: {
        create: [
          { description: "Size 5 ball — competition pack", qty: 120, unit: "u", unitPrice: 18.5 },
          { description: "Reversible bibs (pack of 20)", qty: 40, unit: "pack", unitPrice: 24.5 },
          { description: "Soft training cones", qty: 200, unit: "u", unitPrice: 5 },
        ],
      },
    },
    include: { lines: true },
  });
  const grPartial = await prisma.goodsReceipt.create({
    data: {
      number: "BR-2026-0001",
      poId: poBallons.id,
      type: "GOODS",
      receivedById: camille.id,
      receivedAt: new Date("2026-08-14T15:20:00+02:00"),
      notes: "40 cones short — replenishment announced for 25 August. Balls and bibs in line.",
      status: "confirmed",
      lines: {
        create: [
          {
            poLineId: poBallons.lines[0].id,
            description: poBallons.lines[0].description,
            qtyOrdered: 120,
            qtyReceived: 120,
            unitPrice: 18.5,
          },
          {
            poLineId: poBallons.lines[1].id,
            description: poBallons.lines[1].description,
            qtyOrdered: 40,
            qtyReceived: 40,
            unitPrice: 24.5,
          },
          {
            poLineId: poBallons.lines[2].id,
            description: poBallons.lines[2].description,
            qtyOrdered: 200,
            qtyReceived: 160,
            unitPrice: 5,
          },
        ],
      },
    },
  });
  const accrualAmt = 120 * 18.5 + 40 * 24.5 + 160 * 5;
  await prisma.accrual.create({
    data: {
      receiptId: grPartial.id,
      accountCode: "408",
      amount: accrualAmt,
      status: "open",
    },
  });

  // 5. Recurring cleaning — approved, PO issued
  const daClean = await prisma.requisition.create({
    data: {
      number: "DA-2026-0002",
      title: "Cleaning contract — Lille / Roubaix sites",
      description:
        "24-month framework: industrial cleaning of Lille-Lomme warehouse (3,200 m²) and Roubaix stockroom (900 m²), 5 visits / week, ecolabel products. Vendor NordLog Services.",
      type: "RECURRING",
      amountHT: 28800,
      costCenter: "SITE-NORD",
      neededBy: new Date("2026-09-01"),
      status: "ordered",
      requesterId: camille.id,
      submittedAt: new Date("2026-07-22T09:00:00+02:00"),
      createdAt: new Date("2026-07-21T17:00:00+02:00"),
    },
  });
  await prisma.approvalStep.createMany({
    data: [
      {
        requisitionId: daClean.id,
        level: "N+1",
        approverId: thomas.id,
        status: "approved",
        decidedAt: new Date("2026-07-22T11:00:00+02:00"),
        comment: "Contract needed, current vendor coming to end of term.",
        stepOrder: 1,
      },
      {
        requisitionId: daClean.id,
        level: "N+2",
        approverId: nadia.id,
        status: "approved",
        decidedAt: new Date("2026-07-23T09:40:00+02:00"),
        comment: "Aligned with site CSR policy.",
        stepOrder: 2,
      },
      {
        requisitionId: daClean.id,
        level: "N+3",
        approverId: julien.id,
        status: "approved",
        decidedAt: new Date("2026-07-24T18:10:00+02:00"),
        comment: "OK for 2026 budget, monthly €1,200 excl. VAT.",
        stepOrder: 3,
      },
    ],
  });
  await prisma.purchaseOrder.create({
    data: {
      number: "BC-2026-0003",
      requisitionId: daClean.id,
      vendorId: nordlog.id,
      terms: "24-month contract from 01/09/2026. Monthly billing in arrears. 3-month notice.",
      status: "issued",
      issuedAt: new Date("2026-07-25T10:00:00+02:00"),
      issuedById: lea.id,
      lines: {
        create: [
          {
            description: "Industrial cleaning Lille-Lomme — monthly lump sum",
            qty: 24,
            unit: "month",
            unitPrice: 900,
          },
          {
            description: "Roubaix stockroom cleaning — monthly lump sum",
            qty: 24,
            unit: "month",
            unitPrice: 300,
          },
        ],
      },
    },
  });

  // Extra DA + PO for mismatch invoice (lighting, fully received, invoice wrong price)
  const daLumen = await prisma.requisition.create({
    data: {
      number: "DA-2026-0004",
      title: "LED relamping — checkout aisles, Lille Fives store",
      description:
        "Replacement of 48 checkout-aisle pendants with 4000 K LED luminaires, night installation, take-back of existing fittings.",
      type: "ONE_OFF",
      amountHT: 8640,
      costCenter: "MAG-LIL-05",
      neededBy: new Date("2026-08-20"),
      status: "ordered",
      requesterId: camille.id,
      submittedAt: new Date("2026-08-01T08:30:00+02:00"),
      createdAt: new Date("2026-07-31T18:00:00+02:00"),
    },
  });
  await prisma.approvalStep.createMany({
    data: [
      {
        requisitionId: daLumen.id,
        level: "N+1",
        approverId: thomas.id,
        status: "approved",
        decidedAt: new Date("2026-08-01T10:00:00+02:00"),
        comment: "Night works OK.",
        stepOrder: 1,
      },
      {
        requisitionId: daLumen.id,
        level: "N+2",
        approverId: nadia.id,
        status: "approved",
        decidedAt: new Date("2026-08-01T17:20:00+02:00"),
        comment: "Energy savings to be documented.",
        stepOrder: 2,
      },
    ],
  });
  const poLumen = await prisma.purchaseOrder.create({
    data: {
      number: "BC-2026-0002",
      requisitionId: daLumen.id,
      vendorId: lumen.id,
      terms: "Night install, 21:00–05:00. 5-year warranty. Payment 45 days.",
      status: "received",
      issuedAt: new Date("2026-08-02T09:30:00+02:00"),
      issuedById: lea.id,
      lines: {
        create: [
          { description: "LED pendant 4000 K checkout aisle", qty: 48, unit: "u", unitPrice: 145 },
          { description: "Night install and take-back of existing fittings", qty: 1, unit: "lump", unitPrice: 1680 },
        ],
      },
    },
    include: { lines: true },
  });
  const grLumen = await prisma.goodsReceipt.create({
    data: {
      number: "BR-2026-0002",
      poId: poLumen.id,
      type: "SERVICE",
      receivedById: thomas.id,
      receivedAt: new Date("2026-08-12T07:00:00+02:00"),
      notes: "Install in line, 48 points lit, acceptance report signed.",
      status: "confirmed",
      lines: {
        create: [
          {
            poLineId: poLumen.lines[0].id,
            description: poLumen.lines[0].description,
            qtyOrdered: 48,
            qtyReceived: 48,
            unitPrice: 145,
          },
          {
            poLineId: poLumen.lines[1].id,
            description: poLumen.lines[1].description,
            qtyOrdered: 1,
            qtyReceived: 1,
            unitPrice: 1680,
          },
        ],
      },
    },
  });
  await prisma.accrual.create({
    data: {
      receiptId: grLumen.id,
      accountCode: "408",
      amount: 8640,
      status: "open",
    },
  });

  // 6. Mismatch invoice — Atelier Lumen billed 165 instead of 145
  const invMismatch = await prisma.invoice.create({
    data: {
      number: "AL-2026-114",
      vendorId: lumen.id,
      poId: poLumen.id,
      invoiceDate: new Date("2026-08-13"),
      dueDate: new Date("2026-09-27"),
      amountHT: 9600,
      vatRate: 20,
      vatAmount: 1920,
      amountTTC: 11520,
      glAccountId: gl["611"].id,
      status: "mismatch",
      filename: "AL-2026-114_AtelierLumen.pdf",
      extractedText: "Atelier Lumen — invoice AL-2026-114 — BC-2026-0002 — 48 x €165 + install €1,680",
      matchResult: JSON.stringify({
        matched: false,
        varianceEUR: 960,
        note: "LED unit price €165 vs €145 on the PO",
      }),
      createdById: antoine.id,
      createdAt: new Date("2026-08-15T11:10:00+02:00"),
      lines: {
        create: [
          { description: "LED pendant 4000 K checkout aisle", qty: 48, unitPrice: 165, amount: 7920 },
          { description: "Night install and take-back of existing fittings", qty: 1, unitPrice: 1680, amount: 1680 },
        ],
      },
      steps: {
        create: [
          {
            level: "N+1",
            approverId: julien.id,
            status: "pending",
            stepOrder: 1,
          },
        ],
      },
    },
  });

  // Extra DA + PO fully matched invoice waiting payment — NordLog transport
  const daFreight = await prisma.requisition.create({
    data: {
      number: "DA-2026-0005",
      title: "Warehouse-to-store shuttles — week 32",
      description: "Exceptional charter of 6 rounds after a back-to-school volume spike, outside the framework contract.",
      type: "ONE_OFF",
      amountHT: 5400,
      costCenter: "LOG-HDF",
      neededBy: new Date("2026-08-10"),
      status: "ordered",
      requesterId: camille.id,
      submittedAt: new Date("2026-08-04T08:00:00+02:00"),
      createdAt: new Date("2026-08-03T17:30:00+02:00"),
    },
  });
  await prisma.approvalStep.createMany({
    data: [
      {
        requisitionId: daFreight.id,
        level: "N+1",
        approverId: thomas.id,
        status: "approved",
        decidedAt: new Date("2026-08-04T09:15:00+02:00"),
        comment: "Spike confirmed by the WMS.",
        stepOrder: 1,
      },
      {
        requisitionId: daFreight.id,
        level: "N+2",
        approverId: nadia.id,
        status: "approved",
        decidedAt: new Date("2026-08-04T11:00:00+02:00"),
        comment: "OK, then move onto the transport RFQ.",
        stepOrder: 2,
      },
    ],
  });
  const poFreight = await prisma.purchaseOrder.create({
    data: {
      number: "BC-2026-0004",
      requisitionId: daFreight.id,
      vendorId: nordlog.id,
      terms: "Lump-sum price per round. Photo POD mandatory.",
      status: "received",
      issuedAt: new Date("2026-08-04T14:00:00+02:00"),
      issuedById: lea.id,
      lines: {
        create: [{ description: "7.5 t round Lille → HDF stores", qty: 6, unit: "round", unitPrice: 900 }],
      },
    },
    include: { lines: true },
  });
  const grFreight = await prisma.goodsReceipt.create({
    data: {
      number: "BR-2026-0003",
      poId: poFreight.id,
      type: "SERVICE",
      receivedById: lea.id,
      receivedAt: new Date("2026-08-11T18:00:00+02:00"),
      notes: "6 PODs received, no variance.",
      status: "confirmed",
      lines: {
        create: [
          {
            poLineId: poFreight.lines[0].id,
            description: poFreight.lines[0].description,
            qtyOrdered: 6,
            qtyReceived: 6,
            unitPrice: 900,
          },
        ],
      },
    },
  });
  await prisma.accrual.create({
    data: {
      receiptId: grFreight.id,
      accountCode: "408",
      amount: 5400,
      status: "open",
    },
  });

  // 7. Matched approved invoice waiting payment
  await prisma.invoice.create({
    data: {
      number: "NL-2026-0772",
      vendorId: nordlog.id,
      poId: poFreight.id,
      invoiceDate: new Date("2026-08-12"),
      dueDate: new Date("2026-09-11"),
      amountHT: 5400,
      vatRate: 20,
      vatAmount: 1080,
      amountTTC: 6480,
      glAccountId: gl["624"].id,
      status: "approved",
      filename: "NL-2026-0772_NordLog.pdf",
      matchResult: JSON.stringify({ matched: true, varianceEUR: 0 }),
      createdById: antoine.id,
      createdAt: new Date("2026-08-16T09:40:00+02:00"),
      lines: {
        create: [{ description: "7.5 t round Lille → HDF stores", qty: 6, unitPrice: 900, amount: 5400 }],
      },
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: nadia.id,
        title: "DA-2026-0003 awaiting your approval",
        body: "Lille warehouse racking — €18,400.00 excl. VAT. Thomas Bernard approved on 18 August.",
        href: "/demandes",
        createdAt: new Date("2026-08-18T14:06:00+02:00"),
      },
      {
        userId: camille.id,
        title: "Partial receipt BR-2026-0001",
        body: "Sportline: 40 cones short. 408 accrual opened for €4,000.00 excl. VAT received.",
        href: "/receptions",
        createdAt: new Date("2026-08-14T15:21:00+02:00"),
        read: true,
      },
      {
        userId: camille.id,
        title: "BC-2026-0001 issued to Sportline",
        body: "Léa Hoffmann issued the purchase order Balls and accessories — summer season.",
        href: "/commandes",
        createdAt: new Date("2026-08-06T09:01:00+02:00"),
        read: true,
      },
      {
        userId: julien.id,
        title: "Invoice variance AL-2026-114",
        body: "Atelier Lumen billed €9,600 excl. VAT vs €8,640 on PO/GR (+€960). N+1 AP approval required.",
        href: "/factures",
        createdAt: new Date("2026-08-15T11:12:00+02:00"),
      },
      {
        userId: antoine.id,
        title: "Invoice NL-2026-0772 approved",
        body: "NordLog €5,400 excl. VAT — matched, ready for the next payment run.",
        href: "/paiements",
        createdAt: new Date("2026-08-16T09:41:00+02:00"),
      },
      {
        userId: hugo.id,
        title: "Plis à ouvrir — AO-2026-0001",
        body: "L'échéance du 28 oct. 17 h 00 est passée. 3 plis scellés. Inès Duval doit être présente.",
        href: "/appels-offres",
        createdAt: new Date("2026-08-20T17:01:00+02:00"),
      },
      {
        userId: ines.id,
        title: "Ouverture à deux clés — AO-2026-0001",
        body: "3 plis scellés (Sportline, NordLog, Atelier Lumen). Ouverture avec Hugo Martin.",
        href: "/appels-offres",
        createdAt: new Date("2026-08-20T17:01:00+02:00"),
      },
      {
        userId: lea.id,
        title: "Addendum notified to bidders",
        body: "AO-2026-0001 : brief modifié le 14 oct. Sportline, NordLog et Atelier Lumen notifiés.",
        href: "/appels-offres",
        createdAt: new Date("2026-08-12T11:06:00+02:00"),
        read: true,
      },
      {
        userId: uSportline.id,
        title: "Addendum AO-2026-0001",
        body: "The briefing was changed: 46 checkout displays instead of 38. Your already submitted bid remains valid.",
        href: "/appels-offres",
        createdAt: new Date("2026-08-12T11:06:00+02:00"),
      },
      {
        userId: uNordlog.id,
        title: "Addendum AO-2026-0001",
        body: "The briefing was changed: 46 checkout displays instead of 38.",
        href: "/appels-offres",
        createdAt: new Date("2026-08-12T11:06:00+02:00"),
      },
      {
        userId: uLumen.id,
        title: "Addendum AO-2026-0001",
        body: "The briefing was changed: 46 checkout displays instead of 38.",
        href: "/appels-offres",
        createdAt: new Date("2026-08-12T11:06:00+02:00"),
      },
      {
        userId: uSportline.id,
        title: "Purchase order BC-2026-0001",
        body: "Helios Distribution issued a PO of €4,200.00 excl. VAT — Balls and accessories — summer season.",
        href: "/commandes",
        createdAt: new Date("2026-08-06T09:01:00+02:00"),
      },
      {
        userId: uSportline.id,
        title: "Partial receipt BR-2026-0001",
        body: "Receipt variance: 160 cones received of 200 ordered.",
        href: "/receptions",
        createdAt: new Date("2026-08-14T15:21:00+02:00"),
      },
      {
        userId: uNordlog.id,
        title: "New PO — cleaning contract BC-2026-0003",
        body: "24-month contract, €28,800 excl. VAT. Start of performance 1 September 2026.",
        href: "/commandes",
        createdAt: new Date("2026-07-25T10:01:00+02:00"),
      },
    ],
  });

  // Audit trail samples
  await prisma.auditEvent.createMany({
    data: [
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "create",
        actorId: lea.id,
        details: JSON.stringify({ number: "AO-2026-0001" }),
        createdAt: new Date("2026-10-03T14:10:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "publish",
        actorId: lea.id,
        details: JSON.stringify({ deadline: "2026-10-28T17:00:00+01:00", invites: 3 }),
        createdAt: new Date("2026-10-06T09:30:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "briefing_edit",
        actorId: lea.id,
        details: JSON.stringify({ summary: "46 meubles de caisse" }),
        createdAt: new Date("2026-10-14T11:05:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "bid_submit",
        actorId: uSportline.id,
        details: JSON.stringify({ vendor: "Sportline SAS" }),
        createdAt: new Date("2026-10-24T16:42:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "bid_submit",
        actorId: uNordlog.id,
        details: JSON.stringify({ vendor: "NordLog" }),
        createdAt: new Date("2026-10-26T10:15:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "bid_submit",
        actorId: uLumen.id,
        details: JSON.stringify({ vendor: "Atelier Lumen" }),
        createdAt: new Date("2026-10-27T21:03:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "deadline_passed",
        actorId: lea.id,
        details: JSON.stringify({ bids: 3 }),
        createdAt: new Date("2026-10-28T17:00:01+01:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderOpened.id,
        action: "publish",
        actorId: lea.id,
        details: JSON.stringify({ number: "AO-2026-0005" }),
        createdAt: new Date("2026-09-20T09:00:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderOpened.id,
        action: "unlock_ok",
        actorId: hugo.id,
        details: JSON.stringify({ lock: "A" }),
        createdAt: new Date("2026-10-16T09:58:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderOpened.id,
        action: "unlock_ok",
        actorId: ines.id,
        details: JSON.stringify({ lock: "B" }),
        createdAt: new Date("2026-10-16T10:05:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderOpened.id,
        action: "opened",
        actorId: ines.id,
        details: JSON.stringify({ bids: 2 }),
        createdAt: new Date("2026-10-16T10:05:01+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderAwarded.id,
        action: "publish",
        actorId: lea.id,
        details: JSON.stringify({ number: "AO-2026-0006" }),
        createdAt: new Date("2026-09-05T09:00:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderAwarded.id,
        action: "opened",
        actorId: ines.id,
        details: JSON.stringify({ bids: 2 }),
        createdAt: new Date("2026-10-01T11:20:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderAwarded.id,
        action: "award",
        actorId: lea.id,
        details: JSON.stringify({ vendor: "Atelier Lumen", price: 38400 }),
        createdAt: new Date("2026-10-02T09:15:00+02:00"),
      },
      {
        entityType: "Requisition",
        entityId: daRayonnage.id,
        action: "submit",
        actorId: camille.id,
        details: JSON.stringify({ amountHT: 18400 }),
        createdAt: new Date("2026-08-18T09:20:00+02:00"),
      },
      {
        entityType: "Requisition",
        entityId: daRayonnage.id,
        action: "approve",
        actorId: thomas.id,
        details: JSON.stringify({ level: "N+1" }),
        createdAt: new Date("2026-08-18T14:05:00+02:00"),
      },
      {
        entityType: "Invoice",
        entityId: invMismatch.id,
        action: "mismatch_detected",
        actorId: antoine.id,
        details: JSON.stringify({ varianceEUR: 960 }),
        createdAt: new Date("2026-08-15T11:10:00+02:00"),
      },
    ],
  });

  console.log("Helios Distribution seed OK");
}

const isDirect = process.argv.some((a) => /(?:^|[\\/])seed\.(ts|js)$/.test(a));
if (isDirect) {
  async function main() {
    let prisma: PrismaClient;
    // SAFETY: never touch shared Turso unless explicitly allowed.
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN && process.env.ALLOW_TURSO_SEED === "1") {
      const { PrismaLibSql } = await import("@prisma/adapter-libsql");
      const adapter = new PrismaLibSql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      prisma = new PrismaClient({ adapter });
    } else {
      if (process.env.TURSO_DATABASE_URL && process.env.ALLOW_TURSO_SEED !== "1") {
        delete process.env.TURSO_DATABASE_URL;
        delete process.env.TURSO_AUTH_TOKEN;
        console.log("Refusing Turso seed (set ALLOW_TURSO_SEED=1 to override). Using DATABASE_URL SQLite.");
      }
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:")) {
        throw new Error("DATABASE_URL must be a file: SQLite path for local seed");
      }
      prisma = new PrismaClient();
    }
    try {
      await seedDemo(prisma);
    } finally {
      await prisma.$disconnect();
    }
  }
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
