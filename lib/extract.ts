import { suggestGLAccount } from "./gl-rules";
import { t, type Locale } from "./i18n";

export type ExtractedInvoice = {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  poNumber: string;
  amountHT: number;
  vatRate: number;
  vatAmount: number;
  amountTTC: number;
  lines: Array<{ description: string; qty: number; unitPrice: number; amount: number }>;
  glHint: { code: string; reason: string } | null;
  source: string;
  rawText: string;
};

function sample(locale: Locale = "en"): ExtractedInvoice {
  return {
    vendorName: "Sportline SAS",
    invoiceNumber: "FA-2026-0881",
    invoiceDate: "2026-08-18",
    dueDate: "2026-09-17",
    poNumber: "BC-2026-0002",
    amountHT: 4200,
    vatRate: 20,
    vatAmount: 840,
    amountTTC: 5040,
    lines: [
      { description: "Size 5 ball — competition pack", qty: 120, unitPrice: 18.5, amount: 2220 },
      { description: "Reversible bibs (pack of 20)", qty: 40, unitPrice: 24.5, amount: 980 },
      { description: "Soft training cones", qty: 200, unitPrice: 5, amount: 1000 },
    ],
    glHint: { code: "607", reason: t(locale, "extract.glGoods") },
    source: t(locale, "extract.sampleSource"),
    rawText: `SPORTLINE SAS
Invoice FA-2026-0881
Date: 18/08/2026
Due: 17/09/2026
Purchase order: BC-2026-0002
Helios Distribution — Lille warehouse

Description                         Qty    Unit net   Amount
Size 5 ball — competition pack      120    18.50 €    2,220.00 €
Reversible bibs (pack of 20)         40    24.50 €      980.00 €
Soft training cones                 200     5.00 €    1,000.00 €
                                Total excl. VAT       4,200.00 €
                                VAT 20 %                840.00 €
                                Total incl. VAT       5,040.00 €
IBAN FR76 3000 6000 0112 3456 7890 189`,
  };
}

function parseFrNumber(s: string): number | null {
  const cleaned = s.replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function extractFromText(text: string, filename = "", locale: Locale = "en"): ExtractedInvoice {
  const combined = `${filename}\n${text}`;
  const lower = combined.toLowerCase();

  const vendorGuess = (() => {
    if (/sportline/.test(lower)) return "Sportline SAS";
    if (/nordlog/.test(lower)) return "NordLog";
    if (/lumen/.test(lower)) return "Atelier Lumen";
    const m = text.match(/^\s*([A-Z][A-Za-z0-9 &.'-]{3,40})\s*$/m);
    return m?.[1] ?? "";
  })();

  const num =
    combined.match(/FA[-\s]?20\d{2}[-\s]?\d{3,}/i)?.[0]?.replace(/\s/g, "") ??
    combined.match(/n[°o]\s*[:\s]*([A-Z0-9\/-]{4,})/i)?.[1] ??
    "";

  const po = combined.match(/BC-20\d{2}-\d{4}/)?.[0] ?? "";

  const dateMatch = combined.match(/(\d{2})[\/\.-](\d{2})[\/\.-](20\d{2})/);
  let invoiceDate = "";
  if (dateMatch) invoiceDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

  const htMatch =
    combined.match(/total\s*ht[^\d]{0,10}([\d\s]+[,\.]\d{2})/i) ||
    combined.match(/total\s*excl[^\d]{0,24}([\d\s,]+[,\.]\d{2})/i);
  const ttcMatch =
    combined.match(/total\s*ttc[^\d]{0,10}([\d\s]+[,\.]\d{2})/i) ||
    combined.match(/total\s*incl[^\d]{0,24}([\d\s,]+[,\.]\d{2})/i);
  const tvaMatch =
    combined.match(/tva[^\d]{0,16}([\d\s]+[,\.]\d{2})/i) ||
    combined.match(/vat[^\d]{0,16}([\d\s,]+[,\.]\d{2})/i);
  const rateMatch = combined.match(/(?:tva|vat)\s*(\d{1,2})\s*%/i);

  const amountHT = htMatch ? parseFrNumber(htMatch[1]) ?? 0 : 0;
  const vatAmount = tvaMatch ? parseFrNumber(tvaMatch[1]) ?? 0 : 0;
  const amountTTC = ttcMatch ? parseFrNumber(ttcMatch[1]) ?? (amountHT + vatAmount) : amountHT + vatAmount;
  const vatRate = rateMatch ? parseFloat(rateMatch[1]) : amountHT ? Math.round((vatAmount / amountHT) * 100) : 20;

  let dueDate = "";
  if (invoiceDate) {
    const d = new Date(invoiceDate);
    d.setDate(d.getDate() + 30);
    dueDate = d.toISOString().slice(0, 10);
  }

  const hint = suggestGLAccount(combined);
  const glHint = hint ? { code: hint.code, reason: t(locale, hint.reasonKey) } : null;
  const hasSignal = vendorGuess || num || amountHT > 0 || po;

  if (!hasSignal) {
    const demo = sample(locale);
    return { ...demo, source: t(locale, "extract.noSignal"), rawText: text || demo.rawText };
  }

  return {
    vendorName: vendorGuess,
    invoiceNumber: num,
    invoiceDate,
    dueDate,
    poNumber: po,
    amountHT,
    vatRate,
    vatAmount,
    amountTTC,
    lines: amountHT
      ? [{ description: t(locale, "extract.extractedLine"), qty: 1, unitPrice: amountHT, amount: amountHT }]
      : sample(locale).lines,
    glHint,
    source: t(locale, "extract.pdfSource"),
    rawText: text,
  };
}

export function demoExtract(locale: Locale = "en"): ExtractedInvoice {
  return sample(locale);
}
