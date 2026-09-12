"use server";

import { revalidateS2P } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit, notify } from "@/lib/audit";
import { threeWayMatch } from "@/lib/matching";
import { suggestGLAccount } from "@/lib/gl-rules";
import { extractFromText, demoExtract } from "@/lib/extract";
import { apApprovers } from "@/lib/approvals";
import { getLocale } from "@/lib/i18n/server";

export async function extractInvoice(_prev: unknown, formData: FormData) {
  const locale = await getLocale();
  const file = formData.get("file") as File | null;
  const forceDemo = formData.get("demo") === "1";
  if (forceDemo) return demoExtract(locale);
  if (!file || file.size === 0) return demoExtract(locale);

  const buf = Buffer.from(await file.arrayBuffer());
  let text = "";
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buf });
    const res = await parser.getText();
    text = res.text ?? "";
    await parser.destroy();
  } catch {
    text = buf.toString("utf8");
  }
  return extractFromText(text, file.name, locale);
}

export async function saveInvoice(formData: FormData) {
  const { current } = await requireUser();
  const number = String(formData.get("number") ?? "").trim();
  const vendorId = String(formData.get("vendorId"));
  const poId = String(formData.get("poId") || "") || null;
  const invoiceDate = String(formData.get("invoiceDate"));
  const dueDate = String(formData.get("dueDate"));
  const amountHT = Number(String(formData.get("amountHT")).replace(",", "."));
  const vatRate = Number(String(formData.get("vatRate")).replace(",", ".") || "20");
  const vatAmount = Number(String(formData.get("vatAmount")).replace(",", ".") || amountHT * (vatRate / 100));
  const whtRate = Number(String(formData.get("whtRate")).replace(",", ".") || "0");
  const whtAmount = Number(String(formData.get("whtAmount")).replace(",", ".") || "0");
  const otherTaxes = Number(String(formData.get("otherTaxes")).replace(",", ".") || "0");
  const amountTTC = Number(
    String(formData.get("amountTTC")).replace(",", ".") || amountHT + vatAmount - whtAmount + otherTaxes
  );
  const glAccountId = String(formData.get("glAccountId") || "") || null;
  const extractedText = String(formData.get("extractedText") ?? "");
  const filename = String(formData.get("filename") ?? "");

  const descs = formData.getAll("lineDesc").map(String);
  const qtys = formData.getAll("lineQty").map((v) => Number(String(v).replace(",", ".")));
  const prices = formData.getAll("linePrice").map((v) => Number(String(v).replace(",", ".")));
  let lines = descs
    .map((description, i) => ({
      description,
      qty: qtys[i] || 0,
      unitPrice: prices[i] || 0,
      amount: (qtys[i] || 0) * (prices[i] || 0),
    }))
    .filter((l) => l.description);
  if (lines.length === 0) {
    lines = [{ description: number || "Invoice", qty: 1, unitPrice: amountHT, amount: amountHT }];
  }

  let status = "extracted";
  let matchResult: string | null = null;

  if (poId) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { vendor: true, lines: true, receipts: { include: { lines: true } } },
    });
    if (po) {
      const poQty = po.lines.reduce((s, l) => s + l.qty, 0);
      const poAmount = po.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
      const poPrice = poQty ? poAmount / poQty : 0;
      const receiptQty = po.receipts
        .flatMap((r) => r.lines)
        .reduce((s, l) => s + l.qtyReceived, 0);
      const receiptAmount = po.receipts
        .flatMap((r) => r.lines)
        .reduce((s, l) => s + l.qtyReceived * l.unitPrice, 0);
      const invQty = lines.reduce((s, l) => s + l.qty, 0);
      const invPrice = invQty ? amountHT / invQty : amountHT;
      const match = threeWayMatch({
        poVendor: po.vendor.name,
        invoiceVendor: (await prisma.vendor.findUnique({ where: { id: vendorId } }))?.name ?? "",
        poQty,
        receiptQty,
        invoiceQty: invQty,
        poPrice,
        invoicePrice: invPrice,
        poAmount,
        receiptAmount,
        invoiceAmount: amountHT,
      });
      matchResult = JSON.stringify(match);
      status = match.matched ? "matched" : "mismatch";
    }
  }

  let gl = glAccountId;
  if (!gl) {
    const hint = suggestGLAccount(`${number} ${extractedText} ${lines.map((l) => l.description).join(" ")}`);
    if (hint) {
      const acc = await prisma.chartOfAccount.findUnique({ where: { code: hint.code } });
      gl = acc?.id ?? null;
    }
  }

  const inv = await prisma.invoice.create({
    data: {
      number,
      vendorId,
      poId,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      amountHT,
      vatRate,
      vatAmount,
      whtRate,
      whtAmount,
      otherTaxes,
      amountTTC,
      glAccountId: gl,
      status,
      filename,
      extractedText,
      matchResult,
      createdById: current.id,
      lines: { create: lines },
    },
  });

  if (status === "mismatch") {
    const { n1, n2 } = await apApprovers();
    const needN2 = amountHT > 10000;
    await prisma.approvalStep.create({
      data: { invoiceId: inv.id, level: "N+1", approverId: n1.id, status: "pending", stepOrder: 1 },
    });
    if (needN2) {
      await prisma.approvalStep.create({
        data: { invoiceId: inv.id, level: "N+2", approverId: n2.id, status: "waiting", stepOrder: 2 },
      });
    }
    await notify({
      userId: n1.id,
      title: `This invoice does not match — ${number}`,
      body: "Billed more than we ordered. Needs a look.",
      href: `/factures/${inv.id}`,
    });
  }

  await audit({ entityType: "Invoice", entityId: inv.id, action: "create", actorId: current.id, details: { status } });
  revalidateS2P();
  redirect(`/factures?id=${inv.id}`);
}

export async function arriveInvoice(formData: FormData) {
  const { current } = await requireUser();
  const poId = String(formData.get("poId"));
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { lines: true, invoices: true, vendor: true, receipts: { include: { lines: true } } },
  });
  if (!po) throw new Error("PO not found");
  if (po.invoices.length > 0) {
    redirect(`/factures?id=${po.invoices[0].id}`);
  }

  const lines = po.lines.map((l) => {
    const unitPrice = l.unitPrice * 1.12;
    return {
      description: l.description,
      qty: l.qty,
      unitPrice,
      amount: l.qty * unitPrice,
    };
  });
  const amountHT = lines.reduce((s, l) => s + l.amount, 0);
  const vatRate = 20;
  const vatAmount = amountHT * 0.2;
  const amountTTC = amountHT * 1.2;

  const n3 = await prisma.user.findFirst({ where: { role: "N3" } });
  if (!n3) throw new Error("N3 not found");

  const invoiceDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const poQty = po.lines.reduce((s, l) => s + l.qty, 0);
  const poAmount = po.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const poPrice = poQty ? poAmount / poQty : 0;
  const receiptQty = po.receipts.flatMap((r) => r.lines).reduce((s, l) => s + l.qtyReceived, 0);
  const receiptAmount = po.receipts.flatMap((r) => r.lines).reduce((s, l) => s + l.qtyReceived * l.unitPrice, 0);
  const invQty = lines.reduce((s, l) => s + l.qty, 0);
  const invPrice = invQty ? amountHT / invQty : amountHT;
  const match = threeWayMatch({
    poVendor: po.vendor.name,
    invoiceVendor: po.vendor.name,
    poQty,
    receiptQty,
    invoiceQty: invQty,
    poPrice,
    invoicePrice: invPrice,
    poAmount,
    receiptAmount,
    invoiceAmount: amountHT,
  });

  const inv = await prisma.invoice.create({
    data: {
      number: `INV-${po.number}`,
      vendorId: po.vendorId,
      poId: po.id,
      invoiceDate,
      dueDate,
      amountHT,
      vatRate,
      vatAmount,
      amountTTC,
      status: "mismatch",
      matchResult: JSON.stringify(match),
      createdById: current.id,
      lines: { create: lines },
    },
  });

  await prisma.approvalStep.create({
    data: { invoiceId: inv.id, level: "N+3", approverId: n3.id, status: "pending", stepOrder: 1 },
  });
  await notify({
    userId: n3.id,
    title: `This invoice does not match — ${inv.number}`,
    body: "Billed more than we ordered. Needs a look.",
    href: `/factures?id=${inv.id}`,
  });
  await audit({ entityType: "Invoice", entityId: inv.id, action: "arrive", actorId: current.id, details: { status: "mismatch" } });
  revalidateS2P();
  redirect(`/factures?id=${inv.id}`);
}

export async function approveInvoice(formData: FormData) {
  const { current } = await requireUser();
  const id = String(formData.get("id"));
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) throw new Error("Invoice not found");
  if (inv.status !== "matched" && inv.status !== "extracted") {
    throw new Error("This invoice cannot be approved directly");
  }
  await prisma.invoice.update({ where: { id }, data: { status: "approved" } });
  await audit({ entityType: "Invoice", entityId: id, action: "approve", actorId: current.id });
  revalidateS2P();
}

export async function rejectInvoice(formData: FormData) {
  const { current } = await requireUser();
  const id = String(formData.get("id"));
  await prisma.invoice.update({ where: { id }, data: { status: "rejected" } });
  await audit({ entityType: "Invoice", entityId: id, action: "reject", actorId: current.id });
  revalidateS2P();
}

export async function rematchInvoice(formData: FormData) {
  const { current } = await requireUser();
  const id = String(formData.get("id"));
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { vendor: true, lines: true, po: { include: { vendor: true, lines: true, receipts: { include: { lines: true } } } } },
  });
  if (!inv?.po) return;
  const po = inv.po;
  const poQty = po.lines.reduce((s, l) => s + l.qty, 0);
  const poAmount = po.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const poPrice = poQty ? poAmount / poQty : 0;
  const receiptQty = po.receipts.flatMap((r) => r.lines).reduce((s, l) => s + l.qtyReceived, 0);
  const receiptAmount = po.receipts.flatMap((r) => r.lines).reduce((s, l) => s + l.qtyReceived * l.unitPrice, 0);
  const invQty = inv.lines.reduce((s, l) => s + l.qty, 0);
  const invPrice = invQty ? inv.amountHT / invQty : inv.amountHT;
  const match = threeWayMatch({
    poVendor: po.vendor.name,
    invoiceVendor: inv.vendor.name,
    poQty,
    receiptQty,
    invoiceQty: invQty,
    poPrice,
    invoicePrice: invPrice,
    poAmount,
    receiptAmount,
    invoiceAmount: inv.amountHT,
  });
  await prisma.invoice.update({
    where: { id },
    data: { matchResult: JSON.stringify(match), status: match.matched ? "matched" : "mismatch" },
  });
  await audit({ entityType: "Invoice", entityId: id, action: "rematch", actorId: current.id, details: match });
  revalidateS2P();
}
