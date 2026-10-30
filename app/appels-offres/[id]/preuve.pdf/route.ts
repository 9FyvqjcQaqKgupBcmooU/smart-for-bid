import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { buildAuditChain, sealFingerprint, verifyAuditChain, type ChainableEvent } from "@/lib/audit-chain";
import { auditActionLabel } from "@/lib/audit-labels";
import { extractBudget } from "@/lib/budget";
import { formatParisStamp } from "@/lib/format";

export const runtime = "nodejs";

function safeText(s: string) {
  // Helvetica (WinAnsi) cannot encode all Unicode; ASCII-fold for the PDF.
  return Array.from(s.normalize("NFKD"))
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code >= 0x0300 && code <= 0x036f) return "";
      if (ch === "\u2014" || ch === "\u2013") return "-";
      if (ch === "\u00b7" || ch === "\u2022") return ".";
      if (ch === "\u0153") return "oe";
      if (ch === "\u0152") return "OE";
      if (ch === "\u00e6") return "ae";
      if (ch === "\u00c6") return "AE";
      if (ch === "\u2019" || ch === "\u2018") return "'";
      if (ch === "\u201c" || ch === "\u201d") return '"';
      if (code === 0x202f || code === 0x00a0) return " ";
      if (code < 32 && ch !== "\t" && ch !== "\n" && ch !== "\r") return "";
      if (code > 255) return "?";
      return ch;
    })
    .join("");
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await ctx.params;
  await requireUser();
  const tender = await prisma.tender.findUnique({
    where: { id },
    include: {
      createdBy: { include: { company: true } },
      keyAUser: true,
      keyBUser: true,
      bids: { include: { vendor: true }, orderBy: { submittedAt: "asc" } },
      openings: { include: { officer: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!tender) return new NextResponse("Introuvable", { status: 404 });

  const events = await prisma.auditEvent.findMany({
    where: { entityType: "Tender", entityId: id },
    include: { actor: { include: { company: true, vendor: true } } },
    orderBy: { createdAt: "asc" },
  });

  const chainable: ChainableEvent[] = events.map((e) => ({
    id: e.id,
    entityType: e.entityType,
    entityId: e.entityId,
    action: e.action,
    actorId: e.actorId,
    actorName: e.actor.name,
    orgName: e.actor.vendor?.name ?? e.actor.company?.name ?? "Helios Distribution",
    details: e.details ?? "",
    createdAt: e.createdAt,
  }));
  const chain = buildAuditChain(chainable);
  const verify = verifyAuditChain(chain);
  const seal = sealFingerprint(tender.bids);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 800;
  const ink = rgb(0.06, 0.09, 0.16);
  const soft = rgb(0.4, 0.45, 0.52);
  const cobalt = rgb(0.11, 0.3, 0.85);

  function ensure() {
    if (y < 60) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
  }
  function line(text: string, opts?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }) {
    ensure();
    page.drawText(safeText(text).slice(0, 110), {
      x: 48,
      y,
      size: opts?.size ?? 10,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ?? ink,
    });
    y -= (opts?.size ?? 10) + 6;
  }

  line("Smart For Bid - Preuve d'ouverture", { bold: true, size: 16, color: cobalt });
  line("Document de preuve anti-corruption (journal chaine)", { size: 10, color: soft });
  y -= 6;
  line("AO " + tender.number + " - " + tender.title, { bold: true, size: 12 });
  line("Statut : " + tender.status);
  line("Echeance : " + formatParisStamp(tender.deadline, "fr"));
  const budget = extractBudget(tender.briefing);
  if (budget != null) line("Budget : " + budget.toLocaleString("fr-FR") + " EUR");
  line("Acheteur : " + tender.createdBy.name + " / " + tender.createdBy.company.name);
  line("Officiers : " + tender.keyAUser.name + " (cle A) / " + tender.keyBUser.name + " (cle B)");
  if (tender.openedAt) line("Ouverture : " + formatParisStamp(tender.openedAt, "fr"));
  y -= 8;
  line("Empreinte du pli scelle (SHA-256)", { bold: true, size: 11 });
  line(seal, { size: 8 });
  y -= 6;
  line("Integrite : " + (verify.ok ? "Chaine intacte" : "Chaine rompue"), {
    bold: true,
    color: verify.ok ? rgb(0.06, 0.46, 0.43) : rgb(0.72, 0.11, 0.11),
  });
  line("Hash de pointe : " + verify.tipHash, { size: 8 });
  y -= 8;
  line("Ceremonie d'ouverture a deux cles", { bold: true, size: 11 });
  for (const o of tender.openings) {
    line(o.lock + " / " + o.officer.name + " / " + (o.success ? "ok" : "fail") + " / " + formatParisStamp(o.createdAt, "fr"), { size: 9 });
  }
  y -= 8;
  line("Journal d'audit (ordre chronologique)", { bold: true, size: 11 });
  for (const ev of chain) {
    line(formatParisStamp(ev.createdAt, "fr") + " - " + auditActionLabel(ev.action), { bold: true, size: 9 });
    line(ev.actorName + " / " + ev.orgName, { size: 8, color: soft });
    line("hash " + ev.hash, { size: 7, color: soft });
    y -= 2;
  }
  y -= 8;
  line("Offres (si revelees)", { bold: true, size: 11 });
  if (tender.status === "opened" || tender.status === "awarded") {
    for (const b of tender.bids) {
      let price = "?";
      try { price = String((JSON.parse(b.payload) as { price: number }).price); } catch {}
      line(b.vendor.name + " - " + price + " EUR / " + formatParisStamp(b.submittedAt, "fr"), { size: 9 });
    }
  } else {
    line("Plis encore scelles.", { size: 9, color: soft });
  }
  y -= 16;
  line("Donnees de demonstration fictives - Helios Distribution - Smart For Bid", { size: 8, color: soft });
  line("Genere le " + formatParisStamp(new Date(), "fr") + " (Europe/Paris)", { size: 8, color: soft });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="preuve-' + tender.number + '.pdf"',
      "Cache-Control": "no-store",
    },
  });
  } catch (err) {
    console.error("[preuve.pdf]", err);
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    return new NextResponse("Erreur PDF: " + msg, { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
