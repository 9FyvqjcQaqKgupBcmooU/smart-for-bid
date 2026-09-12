"use client";

import { useActionState } from "react";
import { extractInvoice } from "@/app/actions/invoices";
import { saveInvoice } from "@/app/actions/invoices";
import type { ExtractedInvoice } from "@/lib/extract";
import { t, type Locale } from "@/lib/i18n";

const empty: ExtractedInvoice = {
  vendorName: "",
  invoiceNumber: "",
  invoiceDate: "",
  dueDate: "",
  poNumber: "",
  amountHT: 0,
  vatRate: 20,
  vatAmount: 0,
  amountTTC: 0,
  lines: [{ description: "", qty: 1, unitPrice: 0, amount: 0 }],
  glHint: null,
  source: "",
  rawText: "",
};

export function InvoiceExtractForm({
  vendors,
  pos,
  accounts,
  locale = "en",
}: {
  vendors: { id: string; name: string }[];
  pos: { id: string; number: string; vendorId: string }[];
  accounts: { id: string; code: string; label: string }[];
  locale?: Locale;
}) {
  const [extracted, action, pending] = useActionState(extractInvoice, empty);
  const vendorId =
    vendors.find((v) => v.name.toLowerCase() === extracted.vendorName.toLowerCase())?.id ?? vendors[0]?.id;
  const poId = pos.find((p) => p.number === extracted.poNumber)?.id ?? "";
  const glId = extracted.glHint ? accounts.find((a) => a.code === extracted.glHint?.code)?.id ?? "" : "";

  return (
    <div className="space-y-3">
      <form action={action} className="paper-card rounded-md p-3">
        <h2 className="text-[13px] font-semibold">{t(locale, "fa.captureTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t(locale, "fa.captureHint")}</p>
        <input type="file" name="file" accept="application/pdf,.txt" className="mt-3 block text-sm" />
        <div className="mt-3 flex gap-2">
          <button className="rounded-md bg-ink px-4 py-2 text-sm text-paper" disabled={pending}>
            {pending ? t(locale, "actions.analyzing") : t(locale, "actions.analyzeFile")}
          </button>
          <button name="demo" value="1" className="rounded-md border border-line px-4 py-2 text-sm" disabled={pending}>
            {t(locale, "actions.analyzeAI")}
          </button>
        </div>
        {extracted.source && (
          <p className="mt-3 text-[13px] text-ink-soft">
            {t(locale, "fa.source", { source: extracted.source })}
            {extracted.glHint ? ` · ${extracted.glHint.reason}` : ""}
          </p>
        )}
      </form>

      <form action={saveInvoice} className="paper-card space-y-3 rounded-md p-3">
        <h2 className="text-[13px] font-semibold">{t(locale, "fa.controlTitle")}</h2>
        <input type="hidden" name="extractedText" value={extracted.rawText} />
        <input type="hidden" name="filename" value={extracted.invoiceNumber ? `${extracted.invoiceNumber}.pdf` : ""} />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            {t(locale, "fa.vendor")}
            <select name="vendorId" defaultValue={vendorId} key={vendorId} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2">
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t(locale, "fa.invoiceNo")}
            <input name="number" defaultValue={extracted.invoiceNumber} key={extracted.invoiceNumber} required className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" />
          </label>
          <label className="text-sm">
            {t(locale, "fa.invoiceDate")}
            <input name="invoiceDate" type="date" defaultValue={extracted.invoiceDate} key={extracted.invoiceDate} required className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" />
          </label>
          <label className="text-sm">
            {t(locale, "fa.dueDate")}
            <input name="dueDate" type="date" defaultValue={extracted.dueDate} key={extracted.dueDate} required className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" />
          </label>
          <label className="text-sm">
            {t(locale, "fa.poField")}
            <select name="poId" defaultValue={poId} key={poId} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2">
              <option value="">{t(locale, "fa.offPO")}</option>
              {pos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t(locale, "fa.gl")}
            <select name="glAccountId" defaultValue={glId} key={glId} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2">
              <option value="">{t(locale, "fa.toAllocate")}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <Num name="amountHT" label={t(locale, "fa.ht")} def={extracted.amountHT} />
          <Num name="vatRate" label={t(locale, "fa.vatPct")} def={extracted.vatRate} />
          <Num name="vatAmount" label={t(locale, "fa.vatEur")} def={extracted.vatAmount} />
          <Num name="whtRate" label={t(locale, "fa.whtPct")} def={0} />
          <Num name="whtAmount" label={t(locale, "fa.whtEur")} def={0} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Num name="otherTaxes" label={t(locale, "fa.otherTaxes")} def={0} />
          <Num name="amountTTC" label={t(locale, "fa.ttc")} def={extracted.amountTTC} />
        </div>
        <div>
          <p className="text-[13px] text-ink-soft">{t(locale, "fa.lines")}</p>
          {(extracted.lines.length ? extracted.lines : empty.lines).map((l, i) => (
            <div key={i} className="mt-2 grid grid-cols-12 gap-2">
              <input name="lineDesc" defaultValue={l.description} className="col-span-6 rounded-md border border-line bg-paper px-2 py-1.5 text-sm" />
              <input name="lineQty" defaultValue={l.qty} className="col-span-3 rounded-md border border-line bg-paper px-2 py-1.5 text-sm" />
              <input name="linePrice" defaultValue={l.unitPrice} className="col-span-3 rounded-md border border-line bg-paper px-2 py-1.5 text-sm" />
            </div>
          ))}
        </div>
        <button className="inline-flex h-10 items-center justify-center rounded-full bg-cobalt px-5 text-[14px] font-medium text-paper hover:opacity-90">{t(locale, "actions.saveAndMatch")}</button>
      </form>
    </div>
  );
}

function Num({ name, label, def }: { name: string; label: string; def: number }) {
  return (
    <label className="text-sm">
      {label}
      <input name={name} defaultValue={def || ""} key={`${name}-${def}`} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 tabular" />
    </label>
  );
}
