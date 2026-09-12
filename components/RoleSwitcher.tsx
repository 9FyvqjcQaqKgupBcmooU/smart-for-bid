"use client";

import { useEffect, useRef, useState } from "react";
import { switchUser } from "@/app/actions/session";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { User } from "@prisma/client";
import { cn, firstName } from "@/lib/format";
import { roleLabel, roleShort } from "@/lib/roles";

const ROLE_ORDER = ["REQUESTER", "N1", "N2", "N3", "N4", "BUYER", "OPENING_A", "OPENING_B", "AP", "VENDOR"];

type SwitchUser = User & { vendor: { name: string } | null };

function byDemoOrder(a: SwitchUser, b: SwitchUser) {
  const ia = ROLE_ORDER.indexOf(a.role);
  const ib = ROLE_ORDER.indexOf(b.role);
  if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  return a.name.localeCompare(b.name);
}

export function RoleSwitcher({
  users,
  currentId,
  locale = "en",
}: {
  users: SwitchUser[];
  currentId: string;
  locale?: Locale;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = users.find((u) => u.id === currentId) ?? users[0];
  const internal = users.filter((u) => u.role !== "VENDOR").sort(byDemoOrder);
  const vendors = users.filter((u) => u.role === "VENDOR").sort(byDemoOrder);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function Option({ u }: { u: SwitchUser }) {
    return (
      <form action={switchUser}>
        <input type="hidden" name="userId" value={u.id} />
        <button
          type="submit"
          className={cn(
            "flex min-h-11 w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-[16px]",
            u.id === currentId ? "bg-cobalt-soft font-medium text-ink" : "text-ink hover:bg-paper-2"
          )}
        >
          <span>{u.name}</span>
          <span className="inline-flex items-center rounded-full bg-paper px-2 py-0.5 text-[12px] font-medium text-ink-soft">
            {u.role === "VENDOR" ? t(locale, "roles.full.VENDOR") : roleLabel(locale, u.role)}
          </span>
        </button>
      </form>
    );
  }

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 max-w-[min(100%,14rem)] items-center gap-2 truncate rounded-full bg-paper-2 px-3 text-[14px] font-medium text-ink hover:bg-paper-2 md:max-w-none"
        aria-label={t(locale, "chrome.identity")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {current ? (
          <>
            <span className="min-w-0 truncate">{firstName(current.name)}</span>
            <span className="inline-flex shrink-0 items-center rounded-full bg-paper px-2 py-0.5 text-[12px] font-medium text-ink-soft">
              {current.role === "VENDOR" ? t(locale, "roles.short.VENDOR") : roleShort(locale, current.role)}
            </span>
          </>
        ) : (
          t(locale, "chrome.identity")
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-[70vh] min-w-[min(100vw-1.5rem,18rem)] overflow-y-auto rounded-2xl border border-line/80 bg-paper py-1 shadow-[0_8px_28px_rgba(15,23,42,0.12)] md:min-w-[280px]">
          <p className="px-3 pb-1 pt-2 text-[12px] text-ink-soft">{t(locale, "chrome.groupPeople")}</p>
          {internal.map((u) => (
            <Option key={u.id} u={u} />
          ))}
          {vendors.length > 0 && (
            <>
              <div className="my-1 border-t border-line" />
              <p className="px-3 pb-1 pt-2 text-[12px] text-ink-soft">{t(locale, "chrome.groupVendors")}</p>
              {vendors.map((u) => (
                <Option key={u.id} u={u} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
