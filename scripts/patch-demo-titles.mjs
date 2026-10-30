import { PrismaClient } from "@prisma/client";
const p = new PrismaClient({ datasources: { db: { url: "file:/tmp/bid-demo-edit.db" } } });
const titleMap = {
  "Requester — store purchasing": "Demandeur — achats magasin",
  "Store manager — Lille Fives": "Responsable magasin — Lille Fives",
  "Regional director Hauts-de-France": "Directeur régional Hauts-de-France",
  "Country finance director": "Directeur finance pays",
  "Group CFO": "CFO groupe",
  "Buyer — equipment & services": "Acheteuse — équipement et services",
  "Accounts payable": "Comptabilité fournisseur",
  "Vendor portal": "Portail fournisseur",
};
for (const u of await p.user.findMany()) {
  const next = titleMap[u.title];
  if (next) {
    await p.user.update({ where: { id: u.id }, data: { title: next } });
    console.log("user", u.name, "->", next);
  } else console.log("keep", u.name, u.title);
}
const catMap = {
  "Sports equipment": "Équipement sportif",
  "Logistics & site services": "Logistique et services sur site",
  "Lighting & fit-out": "Éclairage et aménagement",
};
for (const v of await p.vendor.findMany()) {
  const next = catMap[v.category];
  if (next) {
    await p.vendor.update({ where: { id: v.id }, data: { category: next } });
    console.log("vendor", v.name, "->", next);
  }
}
const exact = {
  "Addendum notified to bidders": "Addendum notifié aux soumissionnaires",
  "DA-2026-0003 awaiting your approval": "DA-2026-0003 en attente de votre validation",
  "Partial receipt BR-2026-0001": "Réception partielle BR-2026-0001",
  "BC-2026-0001 issued to Sportline": "BC-2026-0001 émis à Sportline",
  "Invoice variance AL-2026-114": "Écart de facture AL-2026-114",
  "Invoice NL-2026-0772 approved": "Facture NL-2026-0772 approuvée",
  "Purchase order BC-2026-0001": "Bon de commande BC-2026-0001",
  "New PO — cleaning contract BC-2026-0003": "Nouveau BC — contrat de nettoyage BC-2026-0003",
};
for (const n of await p.notification.findMany()) {
  if (exact[n.title]) await p.notification.update({ where: { id: n.id }, data: { title: exact[n.title] } });
}
console.log("---");
for (const u of await p.user.findMany({ select: { name: true, title: true } })) console.log(u.name, "|", u.title);
await p.$disconnect();
