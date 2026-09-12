import { t, type Locale } from "./i18n";
import { formatEUR } from "./format";
import { threeWayMatch, type MatchResult } from "./matching";

export type CostExtra = { label: string; amount: number };

export type CostTrail = {
  planned: number | null;
  plannedLabel: string;
  ordered: number;
  received: number;
  invoiced: number;
  delta: number;
  deltaReason: string | null;
  extras: CostExtra[];
  ttc?: number;
  vat?: number;
  vatRate?: number;
  wht?: number;
};


export function formatCostLine(trail: CostTrail, locale: Locale = "en"): string {
  const billed = trail.invoiced;
  const ordered = trail.ordered;
  if (billed > 0 && ordered > 0) {
    const extra = billed - ordered;
    if (Math.abs(extra) > 0.005) {
      const reason = trail.deltaReason || t(locale, "cost.reasonExtra");
      const core =
        extra > 0
          ? t(locale, "cost.billedMore", { extra: formatEUR(Math.abs(extra), locale) })
          : t(locale, "cost.billedLess", { extra: formatEUR(Math.abs(extra), locale) });
      return `${core} ${reason}.`;
    }
    return t(locale, "cost.billedMatches", {
      billed: formatEUR(billed, locale),
      ordered: formatEUR(ordered, locale),
    });
  }
  if (trail.received > 0 && billed === 0) {
    return t(locale, "cost.accrualSentence", { amount: formatEUR(trail.received, locale) });
  }
  if (ordered > 0) {
    return t(locale, "cost.orderedOnly", { ordered: formatEUR(ordered, locale) });
  }
  if (trail.planned) {
    return t(locale, "cost.plannedOnly", { planned: formatEUR(trail.planned, locale) });
  }
  return "";
}

export function explainLineVariance(
  poLines: { description: string; qty: number; unitPrice: number }[],
  invLines: { description: string; qty: number; unitPrice: number; amount: number }[],
  locale: Locale = "en"
): { reason: string | null; extras: CostExtra[] } {
  const extras: CostExtra[] = [];
  const reasons: string[] = [];
  for (const il of invLines) {
    const pl = poLines.find(
      (p) => p.description.trim().toLowerCase() === il.description.trim().toLowerCase()
    );
    if (!pl) {
      extras.push({ label: il.description, amount: il.amount });
      const low = il.description.toLowerCase();
      if (low.includes("pose") || low.includes("install")) reasons.push(t(locale, "cost.reasonInstall"));
      else if (low.includes("fret") || low.includes("freight") || low.includes("transport")) reasons.push(t(locale, "cost.reasonFreight"));
      else reasons.push(t(locale, "cost.reasonExtra"));
    } else if (Math.abs(pl.unitPrice - il.unitPrice) > 0.005) {
      const gap = (il.unitPrice - pl.unitPrice) * il.qty;
      const a = trimNum(il.unitPrice);
      const b = trimNum(pl.unitPrice);
      extras.push({
        label: t(locale, "cost.extraPrice", { a, b }),
        amount: gap,
      });
      reasons.push(t(locale, "cost.reasonPrice", { a, b }));
    } else if (Math.abs(il.qty - pl.qty) > 0.005) {
      const gap = (il.qty - pl.qty) * il.unitPrice;
      extras.push({ label: t(locale, "cost.extraQty", { a: trimNum(il.qty), b: trimNum(pl.qty) }), amount: gap });
      reasons.push(t(locale, "cost.reasonQty"));
    }
  }
  return { reason: reasons.length ? reasons.join(" · ") : null, extras };
}

function trimNum(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

export function trail(partial: Partial<CostTrail> & { ordered?: number; received?: number; invoiced?: number }): CostTrail {
  const ordered = partial.ordered ?? 0;
  const received = partial.received ?? 0;
  const invoiced = partial.invoiced ?? 0;
  const delta = invoiced > 0 ? invoiced - (ordered || received) : received - ordered;
  return {
    planned: partial.planned ?? null,
    plannedLabel: partial.plannedLabel ?? "planned",
    ordered,
    received,
    invoiced,
    delta: partial.delta ?? delta,
    deltaReason: partial.deltaReason ?? null,
    extras: partial.extras ?? [],
    ttc: partial.ttc,
    vat: partial.vat,
    vatRate: partial.vatRate,
    wht: partial.wht,
  };
}

type POGraph = {
  lines: { qty: number; unitPrice: number; description: string }[];
  receipts: { lines: { qtyReceived: number; unitPrice: number }[]; accruals?: { amount: number; status: string }[] }[];
  invoices?: { amountHT: number; amountTTC?: number; vatAmount?: number; vatRate?: number; whtAmount?: number; lines?: { description: string; qty: number; unitPrice: number; amount: number }[] }[];
  requisition?: { amountHT: number } | null;
};

export function trailFromPO(po: POGraph, opts?: { awarded?: number | null; locale?: Locale }): CostTrail {
  const ordered = po.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const received = po.receipts
    .flatMap((r) => r.lines)
    .reduce((s, l) => s + l.qtyReceived * l.unitPrice, 0);
  const invoices = po.invoices ?? [];
  const invoiced = invoices.reduce((s, i) => s + i.amountHT, 0);
  const last = invoices[invoices.length - 1];
  const expl = last?.lines ? explainLineVariance(po.lines, last.lines, opts?.locale ?? "en") : { reason: null, extras: [] };
  const planned = opts?.awarded ?? po.requisition?.amountHT ?? ordered;
  return trail({
    planned,
    plannedLabel: opts?.awarded != null ? "awarded" : "planned",
    ordered,
    received,
    invoiced,
    deltaReason: expl.reason,
    extras: expl.extras,
    ttc: last?.amountTTC,
    vat: last?.vatAmount,
    vatRate: last?.vatRate,
    wht: last?.whtAmount,
  });
}

export function matchInvoice(
  invoice: {
    vendor: { name: string };
    amountHT: number;
    lines: { qty: number; unitPrice: number; description: string; amount: number }[];
  },
  po:
    | {
        vendor: { name: string };
        lines: { qty: number; unitPrice: number; description: string }[];
        receipts: { lines: { qtyReceived: number; unitPrice: number }[] }[];
      }
    | null
    | undefined,
  locale: Locale = "en"
): { match: MatchResult | null; explanation: { reason: string | null; extras: CostExtra[] } } {
  if (!po) return { match: null, explanation: { reason: null, extras: [] } };
  const poQty = po.lines.reduce((s, l) => s + l.qty, 0);
  const poAmount = po.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const receiptQty = po.receipts.flatMap((r) => r.lines).reduce((s, l) => s + l.qtyReceived, 0);
  const receiptAmount = po.receipts.flatMap((r) => r.lines).reduce((s, l) => s + l.qtyReceived * l.unitPrice, 0);
  const invQty = invoice.lines.reduce((s, l) => s + l.qty, 0);
  const match = threeWayMatch({
    poVendor: po.vendor.name,
    invoiceVendor: invoice.vendor.name,
    poQty,
    receiptQty,
    invoiceQty: invQty,
    poPrice: poQty ? poAmount / poQty : 0,
    invoicePrice: invQty ? invoice.amountHT / invQty : invoice.amountHT,
    poAmount,
    receiptAmount,
    invoiceAmount: invoice.amountHT,
  });
  return { match, explanation: explainLineVariance(po.lines, invoice.lines, locale) };
}
