import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sealPayload, dossierHash } from "../lib/seal-crypto";
import { parseConditions } from "../lib/conditions";

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
  await prisma.dossierReceipt.deleteMany();
  await prisma.tenderQuestion.deleteMany();
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
      name: "Decathlon",
      legalName: "Decathlon SE",
      siren: "500569405",
      address: "4 Boulevard de Mons",
      city: "Villeneuve-d'Ascq",
      zip: "59650",
      nonNegotiables: '["Invoice must be sent exclusively as PDF", "Purchase order number mandatory on every invoice", "Payment terms: 45 days", "Prior acceptance of the compliance and anti-corruption charter", "Valid professional liability insurance certificate", "Compliance with Decathlon social and environmental standards", "Delivery to the warehouses and time slots stated in the brief"]',
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
      category: "Logistics and on-site services",
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
      category: "Lighting and fit-out",
    },
  });

  const camille = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Camille L.",
      email: "camille.l@decathlon.com",
      role: "REQUESTER",
      title: "Requester — store purchasing",
    },
  });
  const thomas = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Thomas B.",
      email: "thomas.b@decathlon.com",
      role: "N1",
      title: "Store manager — Lille Fives",
    },
  });
  const nadia = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Nadia E.",
      email: "nadia.e@decathlon.com",
      role: "N2",
      title: "Regional director — Hauts-de-France",
    },
  });
  const julien = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Julien M.",
      email: "julien.m@decathlon.com",
      role: "N3",
      title: "Country finance director",
    },
  });
  const claire = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Claire P.",
      email: "claire.p@decathlon.com",
      role: "N4",
      title: "Group CFO",
    },
  });
  const paule = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Paule T.",
      email: "paule.t@decathlon.com",
      role: "BUYER",
      title: "Buyer — store equipment",
    },
  });
  const claireA = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Claire A.",
      email: "claire.a@decathlon.com",
      role: "OPENING_A",
      title: "Key holder A",
    },
  });
  const florent = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Florent G.",
      email: "florent.g@decathlon.com",
      role: "VALIDATOR",
      title: "Approver — RFQs",
    },
  });
  const antoine = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Antoine G.",
      email: "antoine.g@decathlon.com",
      role: "AP",
      title: "Accounts payable",
    },
  });
  const uSportline = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Claire P.",
      email: "portail@sportline.fr",
      role: "VENDOR",
      title: "Supplier contact — Sportline SAS",
      vendorId: sportline.id,
    },
  });
  const uNordlog = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Marc D.",
      email: "portail@nordlog.fr",
      role: "VENDOR",
      title: "Supplier contact — NordLog",
      vendorId: nordlog.id,
    },
  });
  const uLumen = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Sophie B.",
      email: "portail@atelier-lumen.fr",
      role: "VENDOR",
      title: "Supplier contact — Atelier Lumen",
      vendorId: lumen.id,
    },
  });

  await prisma.approvalThreshold.createMany({
    data: [
      { minAmount: 0, maxAmount: 999.99, levels: JSON.stringify(["N+1"]), label: "Under €1,000 excl. VAT — N+1 only" },
      { minAmount: 1000, maxAmount: 9999.99, levels: JSON.stringify(["N+1", "N+2"]), label: "€1,000–€9,999 excl. VAT — N+1 then N+2" },
      { minAmount: 10000, maxAmount: 49999.99, levels: JSON.stringify(["N+1", "N+2", "N+3"]), label: "€10,000–€49,999 excl. VAT — up to N+3" },
      { minAmount: 50000, maxAmount: null, levels: JSON.stringify(["N+1", "N+2", "N+3", "N+4"]), label: "€50,000+ excl. VAT — up to N+4 (CFO)" },
    ],
  });

  const accounts = [
    { code: "401", label: "Suppliers", type: "liability" },
    { code: "408", label: "Suppliers — missing invoices", type: "liability" },
    { code: "44566", label: "TVA déductible sur biens et services", type: "tax" },
    { code: "44571", label: "TVA collectée", type: "tax" },
    { code: "442", label: "État — retenue à la source", type: "tax" },
    { code: "512", label: "Banques", type: "asset" },
    { code: "606", label: "Achats non stockés de matières et fournitures", type: "expense" },
    { code: "607", label: "Achats de marchandises", type: "expense" },
    { code: "611", label: "Sous-traitance générale", type: "expense" },
    { code: "613", label: "Locations", type: "expense" },
    { code: "615", label: "Entretien et réparations", type: "expense" },
    { code: "622", label: "Honoraires et commissions", type: "expense" },
    { code: "624", label: "Transports de biens et du personnel", type: "expense" },
    { code: "626", label: "Frais postaux et télécommunications", type: "expense" },
  ];
  await prisma.chartOfAccount.createMany({ data: accounts });
  const gl = Object.fromEntries(
    (await prisma.chartOfAccount.findMany()).map((a) => [a.code, a])
  );

  const hashA = await bcrypt.hash("alpha-open", 10);
  const hashB = await bcrypt.hash("bravo-open", 10);

  const budget = (n: number) => `\n\n<!--bid-budget:${n}-->`;

  const briefingMobilier = `# RFQ — Store fixtures 2026-2028

Decathlon is consulting for a **national framework agreement** for supply and installation of sales fixtures (gondolas, end-caps, checkout furniture).

## Scope
- 38 stores in France, phased rollout
- Term: 24 months firm + 12 months renewable
- Installation excluding Sundays, slot 21:00 – 06:00

## Requirements
- Priced catalogue excl. VAT, free delivery to Lille warehouse
- Replenishment lead time ≤ 12 working days
- 5-year parts and labour warranty

Submit a single offer: year-1 total amount, standard lead time, installation capacity.` + budget(210000);

  const briefingTransport = `# RFQ — Regional transport charter — back-to-school 2026

Need for a **single carrier** for Lille warehouse → Hauts-de-France stores (back-to-school season).

## Volumes
- 18 routes / week, 7.5 t to 12 t
- Store windows 06:00 – 11:00
- EUR pallets, stacking 1.80 m

## Requirements
- Price per loaded km + route minimum
- Continuity plan (strikes, weather)
- POD reporting D+1` + budget(48000);

  const briefingDraft = `# RFQ — Store signage (draft)

Redesign of indoor signage for 12 pilot stores. Brief being drafted with marketing.` + budget(32000);

  const briefingEclairage = `# RFQ — LED lighting — Lomme warehouse

Replacement of 84 LED luminaires (4000 K) in the Lomme warehouse, night installation.` + budget(56000);

  const briefingNettoyage = `# RFQ — Site cleaning services

Multi-site cleaning (warehouse + 6 stores) — 12-month contract.` + budget(78000);

  const briefingIT = `# RFQ — Buyer workstations

Renewal of 24 laptops + docking for the purchasing team.` + budget(42000);

  // Clos / scellé — échéance récente, prêt à ouvrir (pas d'étiquette « en retard » dans l'UI)
  const tenderClosed = await prisma.tender.create({
    data: {
      number: "AO-2026-0001",
      title: "Store fixtures — framework agreement 2026-2028",
      briefing: briefingMobilier,
      status: "published",
      deadline: new Date("2026-10-31T10:00:00+01:00"),
      currency: "EUR",
      nonNegotiables: '["Invoice must be sent exclusively as PDF", "Purchase order number mandatory on every invoice", "Payment terms: 45 days", "Prior acceptance of the compliance and anti-corruption charter", "Valid professional liability insurance certificate", "Compliance with Decathlon social and environmental standards", "Delivery to the warehouses and time slots stated in the brief"]',
      validatorId: florent.id,
      createdById: paule.id,
      keyAUserId: claireA.id,
      keyBUserId: florent.id,
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
      changedById: paule.id,
      summary: "Scope clarification: 46 checkout units instead of 38.",
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
          comments: "Installation by trained in-house crews. Optional annual maintenance +2.4%.",
        }),
        submittedAt: new Date("2026-10-24T16:42:00+02:00"),
      },
      {
        tenderId: tenderClosed.id,
        vendorId: nordlog.id,
        payload: JSON.stringify({
          price: 174900,
          leadTimeDays: 18,
          comments: "Certified installation subcontracting. Capacity 6 stores / month.",
        }),
        submittedAt: new Date("2026-10-26T10:15:00+02:00"),
      },
      {
        tenderId: tenderClosed.id,
        vendorId: lumen.id,
        payload: JSON.stringify({
          price: 191250,
          leadTimeDays: 10,
          comments: "Manufactured in Tourcoing, PEFC wood. Short lead time on the checkout lot.",
        }),
        submittedAt: new Date("2026-10-27T21:03:00+02:00"),
      },
    ],
  });

  // Publié — échéance future
  const tenderOpen = await prisma.tender.create({
    data: {
      number: "AO-2026-0002",
      title: "Regional transport charter — back-to-school 2026",
      briefing: briefingTransport,
      status: "published",
      deadline: new Date("2026-11-18T12:00:00+01:00"),
      currency: "EUR",
      nonNegotiables: '["Invoice must be sent exclusively as PDF", "Purchase order number mandatory on every invoice", "Payment terms: 45 days", "Prior acceptance of the compliance and anti-corruption charter", "Valid professional liability insurance certificate", "Compliance with Decathlon social and environmental standards", "Delivery to the warehouses and time slots stated in the brief"]',
      validatorId: florent.id,
      createdById: paule.id,
      keyAUserId: claireA.id,
      keyBUserId: florent.id,
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
        comments: "Dedicated fleet of 4 trucks. Saturday morning on-call.",
      }),
      submittedAt: new Date("2026-10-27T09:12:00+02:00"),
    },
  });

  // Brouillon
  const tenderDraft = await prisma.tender.create({
    data: {
      number: "AO-2026-0003",
      title: "Store signage — 12-site pilot",
      briefing: briefingDraft,
      status: "pending_validation",
      deadline: new Date("2026-12-05T17:00:00+01:00"),
      currency: "EUR",
      nonNegotiables: '["Invoice must be sent exclusively as PDF", "Purchase order number mandatory on every invoice", "Payment terms: 45 days", "Prior acceptance of the compliance and anti-corruption charter", "Valid professional liability insurance certificate", "Compliance with Decathlon social and environmental standards", "Delivery to the warehouses and time slots stated in the brief"]',
      validatorId: florent.id,
      createdById: paule.id,
      keyAUserId: claireA.id,
      keyBUserId: florent.id,
      createdAt: new Date("2026-10-28T15:20:00+01:00"),
    },
  });

  // Publié sans offre encore
  const tenderPub2 = await prisma.tender.create({
    data: {
      number: "AO-2026-0004",
      title: "LED lighting — Lomme warehouse",
      briefing: briefingEclairage,
      status: "published",
      deadline: new Date("2026-11-28T17:00:00+01:00"),
      currency: "EUR",
      nonNegotiables: '["Invoice must be sent exclusively as PDF", "Purchase order number mandatory on every invoice", "Payment terms: 45 days", "Prior acceptance of the compliance and anti-corruption charter", "Valid professional liability insurance certificate", "Compliance with Decathlon social and environmental standards", "Delivery to the warehouses and time slots stated in the brief"]',
      validatorId: florent.id,
      createdById: paule.id,
      keyAUserId: claireA.id,
      keyBUserId: florent.id,
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
      title: "Multi-site cleaning — annual contract",
      briefing: briefingNettoyage,
      status: "opened",
      deadline: new Date("2026-10-15T17:00:00+02:00"),
      currency: "EUR",
      nonNegotiables: '["Invoice must be sent exclusively as PDF", "Purchase order number mandatory on every invoice", "Payment terms: 45 days", "Prior acceptance of the compliance and anti-corruption charter", "Valid professional liability insurance certificate", "Compliance with Decathlon social and environmental standards", "Delivery to the warehouses and time slots stated in the brief"]',
      validatorId: florent.id,
      createdById: paule.id,
      keyAUserId: claireA.id,
      keyBUserId: florent.id,
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
      payload: JSON.stringify({ price: 71200, leadTimeDays: 5, comments: "Dedicated teams for Northern sites." }),
      submittedAt: new Date("2026-10-12T11:00:00+02:00"),
    },
  });
  await prisma.bid.create({
    data: {
      tenderId: tenderOpened.id,
      vendorId: sportline.id,
      payload: JSON.stringify({ price: 74500, leadTimeDays: 7, comments: "Ecolabel products option." }),
      submittedAt: new Date("2026-10-14T16:20:00+02:00"),
    },
  });
  await prisma.tenderOpening.createMany({
    data: [
      { tenderId: tenderOpened.id, officerId: claireA.id, lock: "A", success: true, createdAt: new Date("2026-10-16T09:58:00+02:00") },
      { tenderId: tenderOpened.id, officerId: florent.id, lock: "B", success: true, createdAt: new Date("2026-10-16T10:05:00+02:00") },
    ],
  });

  // Attribué
  const tenderAwarded = await prisma.tender.create({
    data: {
      number: "AO-2026-0006",
      title: "Buyer team workstations",
      briefing: briefingIT,
      status: "awarded",
      deadline: new Date("2026-09-30T17:00:00+02:00"),
      currency: "EUR",
      nonNegotiables: '["Invoice must be sent exclusively as PDF", "Purchase order number mandatory on every invoice", "Payment terms: 45 days", "Prior acceptance of the compliance and anti-corruption charter", "Valid professional liability insurance certificate", "Compliance with Decathlon social and environmental standards", "Delivery to the warehouses and time slots stated in the brief"]',
      validatorId: florent.id,
      createdById: paule.id,
      keyAUserId: claireA.id,
      keyBUserId: florent.id,
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
      payload: JSON.stringify({ price: 38400, leadTimeDays: 12, comments: "Manufacturer warranty 3 years." }),
      submittedAt: new Date("2026-09-22T14:00:00+02:00"),
    },
  });
  await prisma.bid.create({
    data: {
      tenderId: tenderAwarded.id,
      vendorId: sportline.id,
      payload: JSON.stringify({ price: 40100, leadTimeDays: 10, comments: "Lille delivery included." }),
      submittedAt: new Date("2026-09-28T09:30:00+02:00"),
    },
  });
  await prisma.tender.update({
    where: { id: tenderAwarded.id },
    data: { awardedBidId: bidAward.id },
  });
  await prisma.tenderOpening.createMany({
    data: [
      { tenderId: tenderAwarded.id, officerId: claireA.id, lock: "A", success: true, createdAt: new Date("2026-10-01T11:12:00+02:00") },
      { tenderId: tenderAwarded.id, officerId: florent.id, lock: "B", success: true, createdAt: new Date("2026-10-01T11:20:00+02:00") },
    ],
  });

  // silence unused draft id for TS (referenced via DB)
  void tenderDraft;
  void bidOpenedA;

  // 3. DA pending N+2 — Rayonnage Lille 18 400 €
  const daRayonnage = await prisma.requisition.create({
    data: {
      number: "DA-2026-0003",
      title: "Warehouse racking — Lille",
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
      issuedById: paule.id,
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
      issuedById: paule.id,
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
      title: "LED relamping — checkouts, Lille Fives store",
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
      issuedById: paule.id,
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
      title: "Warehouse–store shuttles — week 32",
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
      issuedById: paule.id,
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
      receivedById: paule.id,
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
        body: "Warehouse racking — Lille — €18,400.00 excl. VAT. Approved by Thomas Bernard on 18 Aug.",
        href: "/demandes",
        createdAt: new Date("2026-08-18T14:06:00+02:00"),
      },
      {
        userId: camille.id,
        title: "Partial receipt BR-2026-0001",
        body: "Sportline: 40 cones missing. Account 408 opened for €4,000.00 excl. VAT received.",
        href: "/receptions",
        createdAt: new Date("2026-08-14T15:21:00+02:00"),
        read: true,
      },
      {
        userId: camille.id,
        title: "PO-2026-0001 issued to Sportline",
        body: "Paule T. issued the purchase order Balls and accessories — summer season.",
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
        body: "NordLog €5,400 excl. VAT — matching OK, ready for the next payment batch.",
        href: "/paiements",
        createdAt: new Date("2026-08-16T09:41:00+02:00"),
      },
      {
        userId: florent.id,
        title: "Approval required — AO-2026-0003",
        body: "Paule T. submitted \"Store signage — 12-site pilot\" for N+1 approval before publication.",
        href: `/appels-offres/${tenderDraft.id}`,
        createdAt: new Date("2026-10-28T15:46:00+01:00"),
      },
      {
        userId: claireA.id,
        title: "Envelopes ready to open — AO-2026-0001",
        body: "The 31 Oct 10:00 Paris time deadline has passed. 3 sealed envelopes. Florent G. must be present.",
        href: `/appels-offres/${tenderClosed.id}?tab=cles`,
        createdAt: new Date("2026-10-31T10:05:00+01:00"),
      },
      {
        userId: florent.id,
        title: "Two-key opening — AO-2026-0001",
        body: "3 sealed envelopes (Sportline, NordLog, Atelier Lumen). Opening with Claire A.",
        href: `/appels-offres/${tenderClosed.id}?tab=cles`,
        createdAt: new Date("2026-10-31T10:05:00+01:00"),
      },
      {
        userId: paule.id,
        title: "Addendum notified to bidders",
        body: "AO-2026-0001: brief updated on 14 Oct. Sportline, NordLog and Atelier Lumen notified.",
        href: `/appels-offres/${tenderClosed.id}?tab=historique`,
        createdAt: new Date("2026-10-14T11:06:00+02:00"),
        read: true,
      },
      {
        userId: uSportline.id,
        title: "Addendum AO-2026-0001",
        body: "The brief has changed: 46 checkout displays instead of 38. Your submitted bid remains valid.",
        href: `/appels-offres/${tenderClosed.id}`,
        createdAt: new Date("2026-10-14T11:06:00+02:00"),
      },
      {
        userId: uNordlog.id,
        title: "Addendum AO-2026-0001",
        body: "The brief has changed: 46 checkout displays instead of 38.",
        href: `/appels-offres/${tenderClosed.id}`,
        createdAt: new Date("2026-10-14T11:06:00+02:00"),
      },
      {
        userId: uLumen.id,
        title: "Addendum AO-2026-0001",
        body: "The brief has changed: 46 checkout displays instead of 38.",
        href: `/appels-offres/${tenderClosed.id}`,
        createdAt: new Date("2026-10-14T11:06:00+02:00"),
      },
      {
        userId: uSportline.id,
        title: "Bon de commande BC-2026-0001",
        body: "Decathlon issued a PO for €4,200.00 excl. VAT — Balls and accessories — summer season.",
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
        body: "24-month contract, €28,800 excl. VAT. Execution starts 1 September 2026.",
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
        actorId: paule.id,
        details: JSON.stringify({ number: "AO-2026-0001" }),
        createdAt: new Date("2026-10-03T14:10:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "validation_request",
        actorId: paule.id,
        details: JSON.stringify({ validator: "Florent G." }),
        createdAt: new Date("2026-10-05T16:40:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "validation_ok",
        actorId: florent.id,
        details: JSON.stringify({ role: "Approver", level: "N+1" }),
        createdAt: new Date("2026-10-06T09:28:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "publish",
        actorId: florent.id,
        details: JSON.stringify({ deadline: "2026-10-28T17:00:00+01:00", invites: 3 }),
        createdAt: new Date("2026-10-06T09:30:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderClosed.id,
        action: "briefing_edit",
        actorId: paule.id,
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
        actorId: paule.id,
        details: JSON.stringify({ bids: 3 }),
        createdAt: new Date("2026-10-28T17:00:01+01:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderDraft.id,
        action: "create",
        actorId: paule.id,
        details: JSON.stringify({ number: "AO-2026-0003" }),
        createdAt: new Date("2026-10-28T15:20:00+01:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderDraft.id,
        action: "validation_request",
        actorId: paule.id,
        details: JSON.stringify({ validator: "Florent G." }),
        createdAt: new Date("2026-10-28T15:45:00+01:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderOpened.id,
        action: "validation_ok",
        actorId: florent.id,
        details: JSON.stringify({ role: "Approver", level: "N+1" }),
        createdAt: new Date("2026-09-20T08:55:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderOpened.id,
        action: "publish",
        actorId: florent.id,
        details: JSON.stringify({ number: "AO-2026-0005" }),
        createdAt: new Date("2026-09-20T09:00:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderOpened.id,
        action: "unlock_ok",
        actorId: claireA.id,
        details: JSON.stringify({ lock: "A" }),
        createdAt: new Date("2026-10-16T09:58:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderOpened.id,
        action: "unlock_ok",
        actorId: florent.id,
        details: JSON.stringify({ lock: "B" }),
        createdAt: new Date("2026-10-16T10:05:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderOpened.id,
        action: "opened",
        actorId: florent.id,
        details: JSON.stringify({ bids: 2 }),
        createdAt: new Date("2026-10-16T10:05:01+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderAwarded.id,
        action: "publish",
        actorId: florent.id,
        details: JSON.stringify({ number: "AO-2026-0006" }),
        createdAt: new Date("2026-09-05T09:00:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderAwarded.id,
        action: "opened",
        actorId: florent.id,
        details: JSON.stringify({ bids: 2 }),
        createdAt: new Date("2026-10-01T11:20:00+02:00"),
      },
      {
        entityType: "Tender",
        entityId: tenderAwarded.id,
        action: "award",
        actorId: paule.id,
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

  // ── Anti-leak: equal dossier, Q&A broadcast, post-bid changes, sealed (encrypted) bids ──
  {
    const at = (iso: string) => new Date(iso);
    const ev = (entityId: string, action: string, actorId: string, details: Record<string, unknown>, iso: string) => ({
      entityType: "Tender",
      entityId,
      action,
      actorId,
      details: JSON.stringify(details),
      createdAt: at(iso),
    });

    // AO-2026-0001 — history v1 → v5
    const c0 = parseConditions(tenderClosed.nonNegotiables);
    const c1 = c0.map((c) => (c === "Payment terms: 45 days" ? "Payment terms: 45 days end of month, by bank transfer" : c));
    const q1 = {
      question: "Can the 46 checkout units be delivered in two batches?",
      answer: "Yes. Two batches are accepted; the second batch must reach the Lille warehouse by 4 December 2026 (week 49).",
      askedAt: "2026-10-24T18:20:00+02:00",
      answeredAt: "2026-10-25T11:05:00+01:00",
    };
    const q2 = {
      question: "Is FSC certification accepted for wood parts, or only PEFC?",
      answer: "Both PEFC and FSC certifications are accepted for all wood parts.",
      askedAt: "2026-10-26T14:00:00+01:00",
      answeredAt: "2026-10-26T16:40:00+01:00",
    };
    const base = { number: tenderClosed.number, title: tenderClosed.title, deadline: tenderClosed.deadline };
    const qa = (qs: typeof q1[]) => qs.map((q, i) => ({ id: "q" + i, question: q.question, answer: q.answer, answeredAt: at(q.answeredAt) }));
    const h1 = dossierHash({ ...base, briefing: briefingMobilier.replace("checkout furniture)", "checkout furniture — quantities to be confirmed)"), nonNegotiables: c0, qa: [] });
    const h2 = dossierHash({ ...base, briefing: briefingMobilier, nonNegotiables: c0, qa: [] });
    const h3 = dossierHash({ ...base, briefing: briefingMobilier, nonNegotiables: c0, qa: qa([q1]) });
    const h4 = dossierHash({ ...base, briefing: briefingMobilier, nonNegotiables: c1, qa: qa([q1]) });
    const h5 = dossierHash({ ...base, briefing: briefingMobilier, nonNegotiables: c1, qa: qa([q1, q2]) });

    await prisma.tender.update({
      where: { id: tenderClosed.id },
      data: { nonNegotiables: JSON.stringify(c1), dossierVersion: 5, dossierHash: h5 },
    });
    await prisma.tenderQuestion.createMany({
      data: [
        { tenderId: tenderClosed.id, askedByVendorId: nordlog.id, question: q1.question, answer: q1.answer, answeredById: paule.id, askedAt: at(q1.askedAt), answeredAt: at(q1.answeredAt) },
        { tenderId: tenderClosed.id, askedByVendorId: lumen.id, question: q2.question, answer: q2.answer, answeredById: paule.id, askedAt: at(q2.askedAt), answeredAt: at(q2.answeredAt) },
      ],
    });
    await prisma.tenderVersion.createMany({
      data: [
        { tenderId: tenderClosed.id, changedById: paule.id, summary: "Q&A answer published: delivery in two batches.", briefing: briefingMobilier, nonNegotiables: JSON.stringify(c0), createdAt: at(q1.answeredAt) },
        { tenderId: tenderClosed.id, changedById: paule.id, summary: "Payment terms clarified: 45 days end of month.", briefing: briefingMobilier, nonNegotiables: JSON.stringify(c1), createdAt: at("2026-10-25T15:30:00+01:00") },
        { tenderId: tenderClosed.id, changedById: paule.id, summary: "Q&A answer published: FSC accepted.", briefing: briefingMobilier, nonNegotiables: JSON.stringify(c1), createdAt: at(q2.answeredAt) },
      ],
    });
    const bidV: Record<string, [number, string]> = { [sportline.id]: [2, h2], [nordlog.id]: [4, h4], [lumen.id]: [5, h5] };
    for (const [vendorId, [v, h]] of Object.entries(bidV)) {
      await prisma.bid.updateMany({ where: { tenderId: tenderClosed.id, vendorId }, data: { dossierVersion: v, dossierHash: h } });
    }
    for (const [actorId, vendor, v, h] of [
      [uSportline.id, "Sportline SAS", 2, h2],
      [uNordlog.id, "NordLog", 4, h4],
      [uLumen.id, "Atelier Lumen", 5, h5],
    ] as const) {
      await prisma.auditEvent.updateMany({
        where: { entityId: tenderClosed.id, action: "bid_submit", actorId },
        data: { details: JSON.stringify({ vendor, dossierVersion: v, dossierHash: h }) },
      });
    }
    await prisma.dossierReceipt.createMany({
      data: [
        { tenderId: tenderClosed.id, vendorId: sportline.id, version: 2, hash: h2, viewedAt: at("2026-10-14T13:02:00+02:00"), ackAt: at("2026-10-24T16:42:00+02:00") },
        { tenderId: tenderClosed.id, vendorId: sportline.id, version: 5, hash: h5, viewedAt: at("2026-10-26T17:20:00+01:00"), ackAt: at("2026-10-26T17:24:00+01:00") },
        { tenderId: tenderClosed.id, vendorId: nordlog.id, version: 4, hash: h4, viewedAt: at("2026-10-26T08:40:00+01:00"), ackAt: at("2026-10-26T09:15:00+01:00") },
        { tenderId: tenderClosed.id, vendorId: nordlog.id, version: 5, hash: h5, viewedAt: at("2026-10-26T18:02:00+01:00"), ackAt: at("2026-10-26T18:05:00+01:00") },
        { tenderId: tenderClosed.id, vendorId: lumen.id, version: 5, hash: h5, viewedAt: at("2026-10-27T19:10:00+01:00"), ackAt: at("2026-10-27T20:03:00+01:00") },
      ],
    });
    const T = tenderClosed.id;
    await prisma.auditEvent.createMany({
      data: [
        ev(T, "dossier_change", paule.id, { version: 2, hash: h2, summary: "Scope clarification: 46 checkout units", postBid: false }, "2026-10-14T11:05:30+02:00"),
        ev(T, "dossier_viewed", uSportline.id, { version: 2, hash: h2 }, "2026-10-14T13:02:00+02:00"),
        ev(T, "qa_question", uNordlog.id, { questionId: "q1" }, q1.askedAt),
        ev(T, "qa_answer", paule.id, { question: q1.question, answer: q1.answer }, q1.answeredAt),
        ev(T, "dossier_change", paule.id, { version: 3, hash: h3, summary: "Q&A answer published", postBid: true }, "2026-10-25T11:05:01+01:00"),
        ev(T, "post_bid_change", paule.id, { postBid: true, field: "Q&A answer", before: "(unanswered) " + q1.question, after: q1.answer, version: 3, hash: h3, bidsAtChange: 1 }, "2026-10-25T11:05:02+01:00"),
        ev(T, "dossier_change", paule.id, { version: 4, hash: h4, summary: "Payment terms clarified", postBid: true }, "2026-10-25T15:30:00+01:00"),
        ev(T, "post_bid_change", paule.id, { postBid: true, field: "Non-negotiable conditions", before: "Payment terms: 45 days", after: "Payment terms: 45 days end of month, by bank transfer", version: 4, hash: h4, bidsAtChange: 1 }, "2026-10-25T15:30:01+01:00"),
        ev(T, "dossier_viewed", uNordlog.id, { version: 4, hash: h4 }, "2026-10-26T08:40:00+01:00"),
        ev(T, "qa_question", uLumen.id, { questionId: "q2" }, q2.askedAt),
        ev(T, "qa_answer", paule.id, { question: q2.question, answer: q2.answer }, q2.answeredAt),
        ev(T, "dossier_change", paule.id, { version: 5, hash: h5, summary: "Q&A answer published", postBid: true }, "2026-10-26T16:40:01+01:00"),
        ev(T, "post_bid_change", paule.id, { postBid: true, field: "Q&A answer", before: "(unanswered) " + q2.question, after: q2.answer, version: 5, hash: h5, bidsAtChange: 2 }, "2026-10-26T16:40:02+01:00"),
        ev(T, "dossier_viewed", uSportline.id, { version: 5, hash: h5 }, "2026-10-26T17:20:00+01:00"),
        ev(T, "dossier_ack", uSportline.id, { version: 5, hash: h5 }, "2026-10-26T17:24:00+01:00"),
        ev(T, "dossier_viewed", uNordlog.id, { version: 5, hash: h5 }, "2026-10-26T18:02:00+01:00"),
        ev(T, "dossier_ack", uNordlog.id, { version: 5, hash: h5 }, "2026-10-26T18:05:00+01:00"),
        ev(T, "dossier_viewed", uLumen.id, { version: 5, hash: h5 }, "2026-10-27T19:10:00+01:00"),
      ],
    });

    // AO-2026-0004 — open RFQ, one broadcast answer + one pending question
    const p2c = parseConditions(tenderPub2.nonNegotiables);
    const qa4 = {
      question: "Is night-time installation allowed in the Lomme warehouse?",
      answer: "Yes, between 21:00 and 05:00, with the Decathlon site manager present.",
      askedAt: "2026-10-29T10:12:00+01:00",
      answeredAt: "2026-10-30T09:40:00+01:00",
    };
    const base4 = { number: tenderPub2.number, title: tenderPub2.title, deadline: tenderPub2.deadline, briefing: tenderPub2.briefing, nonNegotiables: p2c };
    const g1 = dossierHash({ ...base4, qa: [] });
    const g2 = dossierHash({ ...base4, qa: [{ id: "a", question: qa4.question, answer: qa4.answer, answeredAt: at(qa4.answeredAt) }] });
    await prisma.tender.update({ where: { id: tenderPub2.id }, data: { dossierVersion: 2, dossierHash: g2 } });
    await prisma.tenderQuestion.createMany({
      data: [
        { tenderId: tenderPub2.id, askedByVendorId: lumen.id, question: qa4.question, answer: qa4.answer, answeredById: paule.id, askedAt: at(qa4.askedAt), answeredAt: at(qa4.answeredAt) },
        { tenderId: tenderPub2.id, askedByVendorId: nordlog.id, question: "Can suppliers visit the Lomme site before submitting?", askedAt: at("2026-11-03T16:20:00+01:00") },
      ],
    });
    await prisma.tenderVersion.create({
      data: { tenderId: tenderPub2.id, changedById: paule.id, summary: "Q&A answer published: night-time installation.", briefing: tenderPub2.briefing, nonNegotiables: tenderPub2.nonNegotiables, createdAt: at(qa4.answeredAt) },
    });
    await prisma.dossierReceipt.createMany({
      data: [
        { tenderId: tenderPub2.id, vendorId: lumen.id, version: 1, hash: g1, viewedAt: at("2026-10-25T10:02:00+02:00") },
        { tenderId: tenderPub2.id, vendorId: nordlog.id, version: 2, hash: g2, viewedAt: at("2026-10-30T14:15:00+01:00") },
      ],
    });
    const P = tenderPub2.id;
    await prisma.auditEvent.createMany({
      data: [
        ev(P, "publish", florent.id, { dossierVersion: 1, dossierHash: g1 }, "2026-10-25T09:00:00+02:00"),
        ev(P, "dossier_viewed", uLumen.id, { version: 1, hash: g1 }, "2026-10-25T10:02:00+02:00"),
        ev(P, "qa_question", uLumen.id, { questionId: "a" }, qa4.askedAt),
        ev(P, "qa_answer", paule.id, { question: qa4.question, answer: qa4.answer }, qa4.answeredAt),
        ev(P, "dossier_change", paule.id, { version: 2, hash: g2, summary: "Q&A answer published", postBid: false }, "2026-10-30T09:40:01+01:00"),
        ev(P, "dossier_viewed", uNordlog.id, { version: 2, hash: g2 }, "2026-10-30T14:15:00+01:00"),
        ev(P, "qa_question", uNordlog.id, { questionId: "b" }, "2026-11-03T16:20:00+01:00"),
      ],
    });

    // Every other RFQ: v1 hash
    for (const t of await prisma.tender.findMany({ where: { dossierHash: null }, include: { questions: true } })) {
      const h = dossierHash({ number: t.number, title: t.title, deadline: t.deadline, briefing: t.briefing, nonNegotiables: parseConditions(t.nonNegotiables), qa: [] });
      await prisma.tender.update({ where: { id: t.id }, data: { dossierVersion: 1, dossierHash: h } });
      await prisma.bid.updateMany({ where: { tenderId: t.id, dossierVersion: null }, data: { dossierVersion: 1, dossierHash: h } });
    }

    // Seal every bid at rest (AES-256-GCM)
    for (const b of await prisma.bid.findMany()) {
      await prisma.bid.update({ where: { id: b.id }, data: { payload: sealPayload(b.payload) } });
    }
  }

  console.log("Decathlon seed OK");
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
