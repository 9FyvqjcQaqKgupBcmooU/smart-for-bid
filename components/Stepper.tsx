"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { S2P_STEPS, type StepCounts } from "@/lib/s2p";
import { cn } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";

export function Stepper({ counts: _counts, locale = "en" }: { counts: StepCounts; locale?: Locale }) {
  const path = usePathname();
  return (
    <nav className="flex min-w-0 flex-1 items-stretch justify-center gap-4 overflow-x-auto px-2">
      {S2P_STEPS.map((s) => {
        const active = path === s.href || path.startsWith(s.href + "/");
        const label = t(locale, s.labelKey);
        return (
          <Link
            key={s.href}
            href={s.href}
            title={label}
            className={cn(
              "relative flex items-center whitespace-nowrap px-0.5 text-[14px] tracking-tight",
              active ? "font-medium text-ink" : "font-normal text-ink-soft hover:text-ink"
            )}
          >
            {label}
            {active && <span className="absolute inset-x-0 bottom-0 h-px bg-ink" />}
          </Link>
        );
      })}
    </nav>
  );
}
