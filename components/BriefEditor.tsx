"use client";

import { useRef, useState } from "react";
import { importBriefDocument } from "@/app/actions/import-brief";

type Props = {
  name?: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
};

function wrapSelection(
  ta: HTMLTextAreaElement,
  before: string,
  after: string,
  setValue: (v: string) => void
) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.slice(start, end) || "text";
  const next = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
}

export function BriefEditor({ name = "briefing", defaultValue = "", rows = 10, required }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const btn =
    "rounded-xl border border-line bg-paper px-2.5 py-1 text-[13px] font-medium text-ink hover:bg-paper-2 min-h-10";

  async function onImport(file: File) {
    setBusy(true);
    setImportErr(null);
    setImportMsg(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await importBriefDocument(fd);
    setBusy(false);
    if (!res.ok) {
      setImportErr(res.error);
      return;
    }
    setValue(res.markdown);
    setImportMsg(`Content imported from “${res.filename}” — review before saving. The original file is not kept.`);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={btn} onClick={() => taRef.current && wrapSelection(taRef.current, "## ", "", setValue)}>
          Heading
        </button>
        <button type="button" className={btn} onClick={() => taRef.current && wrapSelection(taRef.current, "**", "**", setValue)}>
          Bold
        </button>
        <button type="button" className={btn} onClick={() => taRef.current && wrapSelection(taRef.current, "*", "*", setValue)}>
          Italic
        </button>
        <button type="button" className={btn} onClick={() => taRef.current && wrapSelection(taRef.current, "- ", "", setValue)}>
          List
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => taRef.current && wrapSelection(taRef.current, "1. ", "", setValue)}
        >
          Numbered
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => taRef.current && wrapSelection(taRef.current, "[", "](https://)", setValue)}
        >
          Link
        </button>
        <button
          type="button"
          className={btn}
          onClick={() =>
            taRef.current &&
            wrapSelection(
              taRef.current,
              "| Column | Column |\n| --- | --- |\n| ",
              " |  |\n",
              setValue
            )
          }
        >
          Table
        </button>
        <button type="button" className={btn} disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? "Importing…" : "Import a document"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = "";
          }}
        />
      </div>
      {importErr && <p className="text-[13px] text-danger">{importErr}</p>}
      {importMsg && <p className="text-[13px] text-ink-soft">{importMsg}</p>}
      <textarea
        ref={taRef}
        name={name}
        required={required}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-line bg-paper px-3.5 py-3 font-mono text-[14px] leading-6"
      />
      <p className="text-[12px] text-ink-soft">Markdown — headings, bold, lists, links, simple tables.</p>
    </div>
  );
}
