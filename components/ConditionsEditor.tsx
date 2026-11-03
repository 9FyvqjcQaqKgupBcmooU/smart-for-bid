"use client";

import { useMemo, useState } from "react";

type Row = { text: string; on: boolean; custom?: boolean };

type Props = {
  name?: string;
  defaultItems?: string[];
};

export function ConditionsEditor({ name = "nonNegotiables", defaultItems = [] }: Props) {
  const [items, setItems] = useState<Row[]>(() =>
    defaultItems.length ? defaultItems.map((text) => ({ text, on: true })) : [],
  );
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const payload = useMemo(
    () => JSON.stringify(items.filter((r) => r.on && r.text.trim()).map((r) => r.text.trim())),
    [items],
  );

  function commitDraft() {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [...prev, { text, on: true, custom: true }]);
    setDraft("");
    setAdding(false);
  }

  return (
    <div className="text-[13px]" data-testid="conditions-editor">
      <input type="hidden" name={name} value={payload} />
      <ul className="divide-y divide-line/70 rounded-md border border-line bg-paper">
        {items.map((row, i) => (
          <li key={`${i}-${row.text.slice(0, 24)}`}>
            <label className="flex min-h-10 cursor-pointer items-start gap-2 px-2.5 py-1.5 md:min-h-[30px] md:py-1">
              <input
                type="checkbox"
                className="mt-[3px] h-4 w-4 shrink-0 accent-cobalt"
                checked={row.on}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...row, on: e.target.checked };
                  setItems(next);
                }}
              />
              {row.custom ? (
                <input
                  value={row.text}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...row, text: e.target.value };
                    setItems(next);
                  }}
                  className="min-h-7 w-full flex-1 border-0 bg-transparent p-0 text-[13px] leading-5 text-ink outline-none"
                  aria-label={`Custom condition ${i + 1}`}
                />
              ) : (
                <span className="flex-1 text-[13px] leading-5 text-ink">{row.text}</span>
              )}
              {row.custom ? (
                <button
                  type="button"
                  className="shrink-0 px-1 text-[12px] font-medium text-ink-soft hover:text-ink"
                  aria-label="Remove condition"
                  onClick={(e) => {
                    e.preventDefault();
                    setItems(items.filter((_, j) => j !== i));
                  }}
                >
                  ×
                </button>
              ) : null}
            </label>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="px-2.5 py-2 text-[13px] text-ink-soft">No conditions yet.</li>
        ) : null}
      </ul>

      {adding ? (
        <div className="mt-1.5 flex min-h-10 items-center gap-1.5 md:min-h-[30px]">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === "Escape") {
                setAdding(false);
                setDraft("");
              }
            }}
            placeholder="New condition"
            className="min-h-8 flex-1 rounded border border-line bg-paper px-2 text-[13px] leading-5"
          />
          <button
            type="button"
            className="min-h-8 shrink-0 rounded border border-line px-2 text-[12px] font-medium"
            onClick={commitDraft}
          >
            Add
          </button>
          <button
            type="button"
            className="min-h-8 shrink-0 px-1 text-[12px] text-ink-soft"
            onClick={() => {
              setAdding(false);
              setDraft("");
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="mt-1.5 inline-flex min-h-8 items-center text-[13px] font-medium text-cobalt hover:underline"
          onClick={() => setAdding(true)}
        >
          + Add condition
        </button>
      )}
    </div>
  );
}
