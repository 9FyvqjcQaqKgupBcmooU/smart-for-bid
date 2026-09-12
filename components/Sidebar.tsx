"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import { t, DEFAULT_LOCALE } from "@/lib/i18n";

const STEPS = [
  { n: 1, href: "/demandes", labelKey: "lists.prs", hint: "PR" },
  { n: 2, href: "/commandes", labelKey: "lists.pos", hint: "PO" },
  { n: 3, href: "/receptions", labelKey: "lists.grs", hint: "GR" },
  { n: 4, href: "/factures", labelKey: "lists.invoices", hint: "AP" },
  { n: 5, href: "/paiements", labelKey: "lists.payments", hint: "Pay" },
];

export function Sidebar() {
  const path = usePathname();
  const on = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <aside className="flex w-[272px] shrink-0 flex-col border-r border-line bg-paper">
      <div className="px-5 pb-4 pt-6">
        <Link href="/" className="block">
          <div className="serif text-[28px] leading-none tracking-tight text-ink">
            Smart For Bid
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            Sealed RFQs
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 pb-6">
        <Link
          href="/"
          className={cn(
            "mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm",
            path === "/" ? "text-ink font-medium" : "text-ink-soft hover:text-ink"
          )}
        >
          <span className="serif text-base">⌂</span>
          {t(DEFAULT_LOCALE, "home.todoNow")}
        </Link>

        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          Cycle
        </p>
        <ol className="space-y-1">
          {STEPS.map((s) => {
            const active = on(s.href);
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition",
                    active ? "text-ink font-medium" : "text-ink-soft hover:text-ink"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-semibold tabular",
                      active
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-paper text-ink-soft"
                    )}
                  >
                    {s.n}
                  </span>
                  <span className="flex-1 leading-tight">
                    {t(DEFAULT_LOCALE, s.labelKey)}
                    <span className={cn("ml-2 text-[10px] tracking-wider", active ? "text-paper/70" : "text-ink-soft")}>
                      {s.hint}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          Source
        </p>
        <Link
          href="/appels-offres"
          className={cn(
            "flex items-center gap-3 rounded-md px-2 py-2 text-sm",
            on("/appels-offres") ? "text-ink font-medium" : "text-ink-soft hover:text-ink"
          )}
        >
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border text-[11px]",
              on("/appels-offres")
                ? "border-ink bg-ink text-paper"
                : "border-line bg-paper"
            )}
          >
            ✎
          </span>
          {t(DEFAULT_LOCALE, "lists.rfqs")}
        </Link>

        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          Master data
        </p>
        <Link
          href="/parametres"
          className={cn(
            "flex items-center gap-3 rounded-md px-2 py-2 text-sm",
            on("/parametres") ? "text-ink font-medium" : "text-ink-soft hover:text-ink"
          )}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-[11px]">
            ⌂
          </span>
          {t(DEFAULT_LOCALE, "chrome.settings")}
        </Link>
      </nav>

      <div className="border-t border-line px-5 py-4 text-[11px] leading-relaxed text-ink-soft">
        Helios Distribution SAS
        <br />
        SIREN 891 245 667 · Lille
      </div>
    </aside>
  );
}
