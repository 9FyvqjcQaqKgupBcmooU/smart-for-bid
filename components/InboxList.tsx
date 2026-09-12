"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/format";
import { formatEUR } from "@/lib/format";
import type { InboxItem } from "@/lib/inbox";
import { t, type Locale } from "@/lib/i18n";
import { Chip } from "./Chip";

export function InboxList({
  items,
  selectedKey,
  basePath = "/",
  param = "item",
  locale = "en",
}: {
  items: InboxItem[];
  selectedKey?: string;
  basePath?: string;
  param?: string;
  locale?: Locale;
}) {
  const router = useRouter();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      const keys = items.map((i) => i.key);
      const idx = Math.max(0, keys.indexOf(selectedKey ?? ""));
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const n = keys[Math.min(keys.length - 1, idx + 1)];
        if (n) router.push(`${basePath}?${param}=${encodeURIComponent(n)}`);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const n = keys[Math.max(0, idx - 1)];
        if (n) router.push(`${basePath}?${param}=${encodeURIComponent(n)}`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, selectedKey, router, basePath, param]);

  if (items.length === 0) {
    return <p className="px-4 py-10 text-center text-[15px] text-ink-soft">{t(locale, "home.emptyList")}</p>;
  }

  return (
    <ul className="space-y-2 px-3 pb-4 pt-1">
      {items.map((it) => {
        const active = it.key === selectedKey;
        const verb = it.cta || it.actionLabel;
        return (
          <li key={it.key}>
            <Link
              href={`${basePath}?${param}=${encodeURIComponent(it.key)}`}
              className={cn(
                "soft-card block min-h-11 rounded-[16px] px-3.5 py-3.5 transition-shadow hover:shadow-[0_2px_10px_rgba(15,23,42,0.08)]",
                active && "ring-1 ring-cobalt/20"
              )}
            >
              <span className="flex flex-wrap items-center gap-1.5">
                {verb ? <Chip tone="cobalt">{verb}</Chip> : null}
                {it.support ? <Chip tone="neutral">{it.support}</Chip> : null}
              </span>
              <span className="mt-1.5 block truncate text-[16px] font-medium leading-6 text-ink">{it.headline}</span>
              {(it.number || it.amount != null) && (
                <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-ink-soft">
                  {it.number}
                  {it.amount != null ? `${it.number ? " · " : ""}${formatEUR(it.amount, locale)}` : null}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
