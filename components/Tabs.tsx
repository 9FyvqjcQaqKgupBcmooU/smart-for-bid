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
  const useScroll = n > 3;

  return (
    <div className="min-w-0">
      {useScroll ? (
        <div
          className="flex w-full gap-1 overflow-x-auto rounded-full bg-paper-2 p-1 ring-1 ring-line/60 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {labels.map((l, idx) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={idx === i}
              onClick={() => setI(idx)}
              className={cn(
                "relative z-10 shrink-0 whitespace-nowrap rounded-full px-3.5 py-2.5 text-[13px] md:min-h-9 md:py-2 md:text-[14px]",
                idx === i ? "bg-paper font-semibold text-cobalt shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "font-medium text-ink-soft hover:text-ink"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      ) : (
        <div
          className="relative grid w-full max-w-sm rounded-full bg-paper-2 p-1 ring-1 ring-line/60"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
          role="tablist"
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
              role="tab"
              aria-selected={idx === i}
              onClick={() => setI(idx)}
              className={cn(
                "relative z-10 min-h-11 min-w-0 truncate px-2 text-[13px] md:min-h-9 md:px-3 md:text-[14px]",
                idx === i ? "font-medium text-cobalt" : "text-ink-soft hover:text-ink"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      <div className="min-w-0 pt-4">{panels[i]}</div>
    </div>
  );
}
