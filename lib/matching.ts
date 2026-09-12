export type MatchField = {
  key: string;
  label: string;
  po: string;
  receipt: string;
  invoice: string;
  ok: boolean;
};

export type MatchResult = {
  matched: boolean;
  fields: MatchField[];
  varianceEUR: number;
  variancePct: number;
  withinTolerance: boolean;
};

function money(n: number) {
  return n.toFixed(2);
}

export function withinTolerance(expected: number, actual: number): boolean {
  const abs = Math.abs(expected - actual);
  const pct = expected === 0 ? (abs > 0 ? 1 : 0) : abs / Math.abs(expected);
  return abs <= 5 || pct <= 0.01;
}

export function threeWayMatch(input: {
  poVendor: string;
  invoiceVendor: string;
  poQty: number;
  receiptQty: number;
  invoiceQty: number;
  poPrice: number;
  invoicePrice: number;
  poAmount: number;
  receiptAmount: number;
  invoiceAmount: number;
}): MatchResult {
  const qtyOk =
    Math.abs(input.invoiceQty - input.receiptQty) < 0.001 &&
    input.receiptQty <= input.poQty + 0.001;
  const priceOk = withinTolerance(input.poPrice, input.invoicePrice);
  const amountOk = withinTolerance(input.receiptAmount, input.invoiceAmount);
  const vendorOk = input.poVendor.trim().toLowerCase() === input.invoiceVendor.trim().toLowerCase();

  const varianceEUR = input.invoiceAmount - input.receiptAmount;
  const variancePct = input.receiptAmount === 0 ? 0 : varianceEUR / input.receiptAmount;

  const fields: MatchField[] = [
    {
      key: "vendor",
      label: "Vendor",
      po: input.poVendor,
      receipt: input.poVendor,
      invoice: input.invoiceVendor,
      ok: vendorOk,
    },
    {
      key: "qty",
      label: "Quantity",
      po: money(input.poQty),
      receipt: money(input.receiptQty),
      invoice: money(input.invoiceQty),
      ok: qtyOk,
    },
    {
      key: "price",
      label: "Unit price",
      po: money(input.poPrice) + " €",
      receipt: "—",
      invoice: money(input.invoicePrice) + " €",
      ok: priceOk,
    },
    {
      key: "amount",
      label: "Amount excl. VAT",
      po: money(input.poAmount) + " €",
      receipt: money(input.receiptAmount) + " €",
      invoice: money(input.invoiceAmount) + " €",
      ok: amountOk,
    },
  ];

  const within = vendorOk && qtyOk && priceOk && amountOk;
  return {
    matched: within,
    fields,
    varianceEUR,
    variancePct,
    withinTolerance: withinTolerance(input.receiptAmount, input.invoiceAmount),
  };
}
