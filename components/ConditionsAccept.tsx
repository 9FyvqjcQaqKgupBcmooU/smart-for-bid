"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  items: string[];
};

export function ConditionsAccept({ items }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const all = useMemo(
    () => items.length === 0 || (checked.length === items.length && checked.every(Boolean)),
    [checked, items.length],
  );

  useEffect(() => {
    setChecked(items.map(() => false));
  }, [items.join("\u0001")]);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const sync = () => {
      const buttons = Array.from(form.querySelectorAll("button")) as HTMLButtonElement[];
      for (const btn of buttons) {
        const type = btn.getAttribute("type");
        const isSubmit = !type || type === "submit";
        if (!isSubmit) continue;
        if (btn.dataset.keepEnabled === "1") continue;
        btn.disabled = items.length > 0 && !all;
      }
    };
    sync();
    // Re-apply if RSC/streaming replaces the button node.
    const mo = new MutationObserver(sync);
    mo.observe(form, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
    return () => mo.disconnect();
  }, [all, items.length]);

  return (
    <div
      ref={rootRef}
      className="rounded-md border border-cobalt/35 bg-cobalt-soft/35 px-2.5 py-2"
      data-testid="non-negotiables-accept"
    >
      <h3 className="text-[13px] font-semibold leading-5 text-ink">Non-negotiable conditions</h3>
      <p className="text-[12px] leading-4 text-ink-soft">Tick every condition to enable submission.</p>
      <ul className="mt-1 divide-y divide-cobalt/15">
        {items.map((it, i) => (
          <li key={i}>
            <label className="flex min-h-10 cursor-pointer items-start gap-2 py-1.5 text-[13px] leading-5 md:min-h-[30px] md:py-1">
              <input
                type="checkbox"
                name="conditionAccept"
                value={it}
                required={items.length > 0}
                className="mt-[3px] h-4 w-4 shrink-0 accent-cobalt"
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
      {!all && items.length > 0 ? (
        <p className="mt-1 text-[12px] font-medium leading-4 text-danger">
          Tick every non-negotiable condition to enable submission.
        </p>
      ) : null}
    </div>
  );
}
