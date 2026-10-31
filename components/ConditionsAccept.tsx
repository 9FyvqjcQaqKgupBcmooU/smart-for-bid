"use client";

import { useMemo, useState } from "react";

type Props = {
  items: string[];
};

export function ConditionsAccept({ items }: Props) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const all = useMemo(() => checked.length > 0 && checked.every(Boolean), [checked]);

  return (
    <div className="rounded-xl border-2 border-cobalt/40 bg-cobalt-soft/40 p-4">
      <h3 className="text-[15px] font-semibold text-ink">Conditions non négociables</h3>
      <p className="mt-1 text-[13px] leading-5 text-ink-soft">
        Vous devez accepter chaque condition pour déposer une offre scellée.
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i}>
            <label className="flex min-h-10 items-start gap-3 text-[14px] leading-5">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
                checked={checked[i] || false}
                onChange={(e) => {
                  const next = [...checked];
                  next[i] = e.target.checked;
                  setChecked(next);
                }}
              />
              <span>{it}</span>
            </label>
          </li>
        ))}
      </ul>
      <input type="hidden" name="conditionsAccepted" value={all ? "1" : "0"} />
      <input type="hidden" name="acceptedConditionsJson" value={JSON.stringify(items)} />
      {!all && (
        <p className="mt-3 text-[13px] font-medium text-danger">
          Cochez toutes les conditions non négociables pour activer le dépôt.
        </p>
      )}
    </div>
  );
}
