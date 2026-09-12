"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

export function Tabs({
  labels,
  children,
  initial = 0,
}: {
  labels: string[];
  children: ReactNode;
  initial?: number;
}) {
  const [i, setI] = useState(initial);
  const panels = Array.isArray(children) ? children : [children];
  const n = Math.max(1, labels.length);
  return (
    <div>
      <div
        className="relative grid w-full max-w-md rounded-full bg-paper-2 p-1"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-paper shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-transform duration-200 ease-out"
          style={{
            width: `calc((100% - 0.5rem) / ${n})`,
            transform: `translateX(${i * 100}%)`,
          }}
        />
        {labels.map((l, idx) => (
          <button
            key={l}
            type="button"
            onClick={() => setI(idx)}
            className={cn(
              "relative z-10 min-h-11 min-w-11 px-3 text-[14px]",
              idx === i ? "font-medium text-ink" : "text-ink-soft hover:text-ink"
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="pt-5">{panels[i]}</div>
    </div>
  );
}
