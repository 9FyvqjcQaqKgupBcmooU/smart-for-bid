"use client";

import { useState } from "react";
import Link from "next/link";
import { markAllRead, markNotificationRead } from "@/app/actions/session";
import { formatDateTime } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";

type N = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: Date;
};

export function NotificationBell({ items, locale = "en" }: { items: N[]; locale?: Locale }) {
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-[15px] text-ink-soft hover:bg-paper-2 hover:text-ink"
        aria-label={t(locale, "chrome.notifications")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 1.75a3.25 3.25 0 0 0-3.25 3.25v2.1L3.4 9.4A.75.75 0 0 0 4 10.75h8a.75.75 0 0 0 .6-1.35L11.25 7.1V5A3.25 3.25 0 0 0 8 1.75Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M6.25 12.25a1.75 1.75 0 0 0 3.5 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-ink" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-lg border border-line bg-paper shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-[15px] font-medium">{t(locale, "chrome.notifications")}</span>
            <form action={markAllRead}>
              <button className="text-[13px] text-ink-soft hover:text-ink">{t(locale, "chrome.markAllRead")}</button>
            </form>
          </div>
          <ul className="max-h-[420px] overflow-auto">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-[15px] text-ink-soft">{t(locale, "chrome.noNotifications")}</li>
            )}
            {items.map((n) => (
              <li key={n.id} className={n.read ? "opacity-70" : ""}>
                <Link
                  href={n.href || "/"}
                  onClick={() => {
                    if (!n.read) markNotificationRead(n.id);
                    setOpen(false);
                  }}
                  className="block border-b border-line px-4 py-3 hover:bg-paper-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-medium">{n.title}</p>
                    {!n.read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />}
                  </div>
                  <p className="mt-1 text-[13px] leading-[18px] text-ink-soft">{n.body}</p>
                  <p className="mt-1 text-[12px] text-ink-soft/80">{formatDateTime(n.createdAt, locale)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
