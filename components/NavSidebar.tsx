"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";
import { SealMark } from "./SealMark";

type Props = {
  locale: Locale;
  isSupplier: boolean;
  canCreate: boolean;
  companyName?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function NavSidebar({
  locale,
  isSupplier,
  canCreate,
  companyName,
  mobileOpen = false,
  onClose,
}: Props) {
  const path = usePathname();
  const onHome = path === "/" || (path.startsWith("/appels-offres") && !path.startsWith("/appels-offres/nouveau"));
  const onSettings = path.startsWith("/parametres");
  const onNew = path.startsWith("/appels-offres/nouveau");

  const linkBase =
    "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors";

  function NavBody({ compactHeader = false }: { compactHeader?: boolean }) {
    return (
      <>
        {!compactHeader && (
          <div className="border-b border-line/80 px-4 pb-4 pt-5">
            <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-cobalt-soft">
                <SealMark size={18} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold tracking-tight text-ink">
                  {t(locale, "product.name")}
                </span>
                <span className="block truncate text-[11px] text-ink-soft">
                  {isSupplier ? t(locale, "roles.short.VENDOR") : t(locale, "roles.short.BUYER")}
                </span>
              </span>
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-1 px-2.5 py-3" aria-label={t(locale, "shell.nav")}>
          <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            {t(locale, "shell.nav")}
          </p>

          <Link
            href="/"
            onClick={onClose}
            className={cn(
              linkBase,
              onHome && !onNew
                ? "bg-cobalt-soft font-medium text-cobalt shadow-[inset_3px_0_0_0_var(--cobalt)]"
                : "font-normal text-ink-soft hover:bg-paper-2 hover:text-ink"
            )}
          >
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-md text-[12px]",
                onHome && !onNew ? "bg-paper text-cobalt" : "bg-paper-2 text-ink-soft group-hover:text-ink"
              )}
              aria-hidden
            >
              ≡
            </span>
            {isSupplier ? t(locale, "shell.dashboardSupplier") : t(locale, "shell.dashboard")}
          </Link>

          {canCreate && (
            <Link
              href="/appels-offres/nouveau"
              onClick={onClose}
              className={cn(
                linkBase,
                onNew
                  ? "bg-cobalt-soft font-medium text-cobalt shadow-[inset_3px_0_0_0_var(--cobalt)]"
                  : "font-normal text-ink-soft hover:bg-paper-2 hover:text-ink"
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-md text-[13px]",
                  onNew ? "bg-paper text-cobalt" : "bg-paper-2 text-ink-soft group-hover:text-ink"
                )}
                aria-hidden
              >
                +
              </span>
              {t(locale, "shell.newRfq")}
            </Link>
          )}

          <Link
            href="/parametres"
            onClick={onClose}
            className={cn(
              linkBase,
              onSettings
                ? "bg-cobalt-soft font-medium text-cobalt shadow-[inset_3px_0_0_0_var(--cobalt)]"
                : "font-normal text-ink-soft hover:bg-paper-2 hover:text-ink"
            )}
          >
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-md text-[12px]",
                onSettings ? "bg-paper text-cobalt" : "bg-paper-2 text-ink-soft group-hover:text-ink"
              )}
              aria-hidden
            >
              ⚙
            </span>
            {t(locale, "chrome.settings")}
          </Link>
        </nav>

        {companyName ? (
          <div className="mt-auto border-t border-line/80 px-4 py-3 text-[11px] leading-relaxed text-ink-soft">
            {companyName}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <aside className="hidden w-[232px] shrink-0 flex-col border-r border-line/80 bg-paper md:flex">
        <NavBody />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-ink/30 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          aria-label={t(locale, "shell.closeMenu")}
          onClick={onClose}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(84vw,288px)] flex-col border-r border-line bg-paper shadow-[4px_0_24px_rgba(15,23,42,0.08)] transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-line/80 px-3 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              {t(locale, "shell.nav")}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-2 hover:text-ink"
              aria-label={t(locale, "shell.closeMenu")}
            >
              ✕
            </button>
          </div>
          <NavBody compactHeader />
        </aside>
      </div>
    </>
  );
}
