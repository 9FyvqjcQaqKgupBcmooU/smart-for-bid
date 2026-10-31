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
  userName?: string;
  userTitle?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
};

function NavContents({
  locale,
  isSupplier,
  canCreate,
  companyName,
  userName,
  userTitle,
  onClose,
  path,
}: {
  locale: Locale;
  isSupplier: boolean;
  canCreate: boolean;
  companyName?: string;
  userName?: string;
  userTitle?: string;
  onClose?: () => void;
  path: string;
}) {
  const onHome = path === "/" || (path.startsWith("/appels-offres") && !path.startsWith("/appels-offres/nouveau"));
  const onSettings = path.startsWith("/parametres");
  const onNew = path.startsWith("/appels-offres/nouveau");
  const linkBase =
    "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors";

  return (
    <>
      <div className="border-b border-line px-4 pb-4 pt-5">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cobalt text-[12px] font-semibold text-paper">
            SF
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold tracking-tight text-ink">
              {t(locale, "product.name")}
            </span>
            {/* Logo Decathlon (source Wikimedia Commons) — couleurs d'origine, non déformées */}
            <span className="mt-1.5 block">
              <img
                src="/decathlon.svg"
                alt={companyName || "Decathlon"}
                className="h-5 w-auto max-w-[140px] object-contain object-left"
              />
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2.5 py-3" aria-label={t(locale, "shell.nav")}>
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/65">
          Travail
        </p>

        <Link
          href="/"
          onClick={onClose}
          className={cn(
            linkBase,
            onHome && !onNew
              ? "bg-cobalt-soft font-semibold text-ink shadow-[inset_3px_0_0_0_var(--cobalt)]"
              : "text-ink hover:bg-paper-2"
          )}
        >
          <span
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md text-[13px]",
              onHome && !onNew ? "bg-paper text-cobalt" : "bg-paper-2 text-ink/70"
            )}
            aria-hidden
          >
            <SealMark size={14} />
          </span>
          {isSupplier ? t(locale, "shell.dashboardSupplier") : t(locale, "shell.dashboard")}
        </Link>

        {canCreate ? (
          <Link
            href="/appels-offres/nouveau"
            onClick={onClose}
            className={cn(
              linkBase,
              onNew
                ? "bg-cobalt-soft font-semibold text-ink shadow-[inset_3px_0_0_0_var(--cobalt)]"
                : "text-ink hover:bg-paper-2"
            )}
          >
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-md text-[15px] font-semibold",
                onNew ? "bg-paper text-cobalt" : "bg-paper-2 text-ink/70"
              )}
              aria-hidden
            >
              +
            </span>
            {t(locale, "shell.newRfq")}
          </Link>
        ) : null}

        <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/65">
          Compte
        </p>

        <Link
          href="/parametres"
          onClick={onClose}
          className={cn(
            linkBase,
            onSettings
              ? "bg-cobalt-soft font-semibold text-ink shadow-[inset_3px_0_0_0_var(--cobalt)]"
              : "text-ink hover:bg-paper-2"
          )}
        >
          <span
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md text-[13px]",
              onSettings ? "bg-paper text-cobalt" : "bg-paper-2 text-ink/70"
            )}
            aria-hidden
          >
            ⚙
          </span>
          {t(locale, "shell.settings")}
        </Link>
      </nav>

      <div className="mt-auto border-t border-line px-4 py-3">
        <p className="truncate text-[13px] font-semibold text-ink">{userName}</p>
        <p className="truncate text-[12px] font-medium text-ink/65">{userTitle}</p>
      </div>
    </>
  );
}

export function NavSidebar({
  locale,
  isSupplier,
  canCreate,
  companyName,
  userName,
  userTitle,
  mobileOpen = false,
  onClose,
}: Props) {
  const path = usePathname();
  const contents = (
    <NavContents
      locale={locale}
      isSupplier={isSupplier}
      canCreate={canCreate}
      companyName={companyName}
      userName={userName}
      userTitle={userTitle}
      onClose={onClose}
      path={path}
    />
  );

  return (
    <>
      <aside className="hidden w-[232px] shrink-0 flex-col border-r border-line bg-paper md:flex">{contents}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label={t(locale, "shell.closeMenu")} onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-[min(288px,88vw)] flex-col bg-paper shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="text-[14px] font-semibold text-ink">{t(locale, "shell.menu")}</span>
              <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-[14px] font-medium text-ink">
                {t(locale, "shell.closeMenu")}
              </button>
            </div>
            {contents}
          </aside>
        </div>
      ) : null}
    </>
  );
}
