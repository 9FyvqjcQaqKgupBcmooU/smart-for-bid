"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PIPELINE_STEPS, pipelineIndexFromPath } from "@/lib/s2p";
import { cn } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";

export function Pipeline({
  locale,
  activeIndex,
}: {
  locale: Locale;
  /** 0–4 current node. `null` = none current. Omit to derive from the route. */
  activeIndex?: number | null;
}) {
  const path = usePathname() ?? "/";
  const active = activeIndex === undefined ? pipelineIndexFromPath(path) : activeIndex;
  const current = active ?? -1;

  return (
    <nav aria-label={t(locale, "steps.pipeline")} className="flex shrink-0 items-center">
      <ol className="m-0 flex list-none items-center gap-5 p-0">
        {PIPELINE_STEPS.map((s, i) => {
          const isCurrent = i === current;
          const label = t(locale, s.labelKey);
          return (
            <li key={s.href} className="shrink-0">
              <Link
                href={s.href}
                title={label}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "whitespace-nowrap text-[13px] leading-none tracking-tight",
                  isCurrent
                    ? "font-medium text-ink"
                    : "font-normal text-ink-soft hover:text-ink"
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
