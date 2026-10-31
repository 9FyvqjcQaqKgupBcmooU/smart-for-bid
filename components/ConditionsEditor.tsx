"use client";

import { useState } from "react";

type Props = {
  name?: string;
  defaultItems?: string[];
};

export function ConditionsEditor({ name = "nonNegotiables", defaultItems = [] }: Props) {
  const [items, setItems] = useState<string[]>(defaultItems.length ? defaultItems : [""]);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(items.map((s) => s.trim()).filter(Boolean))} />
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <input
              value={it}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                setItems(next);
              }}
              className="min-h-10 w-full rounded-md border border-line bg-paper px-3 py-2 text-[14px]"
              placeholder={`Condition ${i + 1}`}
            />
            <button
              type="button"
              className="min-h-10 shrink-0 rounded-md border border-line px-3 text-[13px]"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              aria-label="Retirer"
            >
              Retirer
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="min-h-10 rounded-md border border-line bg-paper px-3 text-[13px] font-medium"
        onClick={() => setItems([...items, ""])}
      >
        Ajouter une condition
      </button>
    </div>
  );
}
