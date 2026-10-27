import Link from "next/link";
import { StatusPill } from "./StatusPill";
import { SealMark, sealStateOf } from "./SealMark";
import { cn, formatDateTime, formatDate, formatTime, daysUntil } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";

export type AORow = {
  id: string;
  number: string;
  title: string;
  status: string;
  deadline: Date;
  bidCount: number;
  inviteCount: number;
  keyAUnlocked: boolean;
  keyBUnlocked: boolean;
  myOfferSubmittedAt?: Date | null;
  myOfferSealed?: boolean;
};

const STATUSES = ["draft", "published", "closed", "opened", "awarded"] as const;

function effectiveStatus(row: AORow, now: number) {
  if (row.status === "published" && row.deadline.getTime() <= now) return "closed";
  return row.status;
}

function sortHref(base: string, sort: string, dir: "asc" | "desc", status?: string, q?: string) {
  const sp = new URLSearchParams();
  if (status && status !== "all") sp.set("status", status);
  if (q) sp.set("q", q);
  sp.set("sort", sort);
  sp.set("dir", dir);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function AOTable({
  rows,
  locale,
  isSupplier,
  canCreate,
  statusFilter = "all",
  sort = "deadline",
  dir = "asc",
  q,
  now,
}: {
  rows: AORow[];
  locale: Locale;
  isSupplier: boolean;
  canCreate: boolean;
  statusFilter?: string;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  now: number;
}) {
  const base = "/";
  const flip = (col: string): "asc" | "desc" => (sort === col && dir === "asc" ? "desc" : "asc");

  const filtered = rows.filter((r) => {
    if (statusFilter && statusFilter !== "all") {
      if (effectiveStatus(r, now) !== statusFilter) return false;
    }
    if (q) {
      const hay = `${r.number} ${r.title}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const mul = dir === "desc" ? -1 : 1;
    if (sort === "ref") return mul * a.number.localeCompare(b.number);
    if (sort === "title") return mul * a.title.localeCompare(b.title);
    if (sort === "status") return mul * effectiveStatus(a, now).localeCompare(effectiveStatus(b, now));
    if (sort === "offers") return mul * (a.bidCount - b.bidCount);
    return mul * (a.deadline.getTime() - b.deadline.getTime());
  });

  function SortLink({ col, label }: { col: string; label: string }) {
    const active = sort === col;
    return (
      <Link
        href={sortHref(base, col, flip(col), statusFilter, q)}
        className={cn("inline-flex items-center gap-1 hover:text-ink", active ? "text-ink" : "text-ink-soft")}
        title={dir === "asc" ? t(locale, "shell.sortAsc") : t(locale, "shell.sortDesc")}
      >
        {label}
        {active ? <span className="num text-[10px]">{dir === "asc" ? "↑" : "↓"}</span> : null}
      </Link>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line/80 px-4 py-3 md:px-6">
        <h1 className="text-[15px] font-semibold tracking-tight text-ink">
          {isSupplier ? t(locale, "shell.dashboardSupplier") : t(locale, "shell.dashboard")}
        </h1>
        <span className="num text-[12px] text-ink-soft">{sorted.length}</span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.08em] text-ink-soft">{t(locale, "shell.filterStatus")}</span>
          <Link
            href={sortHref(base, sort, dir, "all", q)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[12px] font-medium",
              statusFilter === "all" || !statusFilter ? "bg-cobalt text-paper" : "bg-paper-2 text-ink-soft hover:text-ink"
            )}
          >
            {t(locale, "shell.filterAll")}
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={sortHref(base, sort, dir, s, q)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[12px] font-medium",
                statusFilter === s ? "bg-cobalt text-paper" : "bg-paper-2 text-ink-soft hover:text-ink"
              )}
            >
              {t(locale, `status.${s}`)}
            </Link>
          ))}
          {canCreate ? (
            <Link
              href="/appels-offres/nouveau"
              className="ml-1 inline-flex min-h-9 items-center rounded-full bg-cobalt px-3.5 text-[13px] font-medium text-paper hover:opacity-90"
            >
              {t(locale, "shell.newRfq")}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Mobile search */}
      <form action="/" method="get" className="border-b border-line/70 px-3 py-2 md:hidden">
        {statusFilter && statusFilter !== "all" ? <input type="hidden" name="status" value={statusFilter} /> : null}
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t(locale, "shell.searchPlaceholder")}
          className="min-h-10 w-full rounded-full border border-line bg-paper-2 px-3.5 text-[14px]"
        />
      </form>

      <div className="min-h-0 flex-1 overflow-auto">
        {sorted.length === 0 ? (
          <div className="flex h-full min-h-[240px] items-center justify-center p-8 text-center">
            <div>
              <p className="text-[16px] font-medium text-ink">
                {rows.length === 0
                  ? isSupplier
                    ? t(locale, "shell.emptySupplier")
                    : t(locale, "shell.emptyClient")
                  : t(locale, "shell.emptyFiltered")}
              </p>
              {canCreate && rows.length === 0 ? (
                <Link href="/appels-offres/nouveau" className="mt-3 inline-flex min-h-10 items-center rounded-full bg-cobalt px-4 text-[14px] font-medium text-paper">
                  {t(locale, "shell.newRfq")}
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-paper-2 text-[11px] uppercase tracking-[0.06em] text-ink-soft">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 font-medium md:px-6">
                  <SortLink col="ref" label={t(locale, "shell.colRef")} />
                </th>
                <th className="px-2 py-2 font-medium">
                  <SortLink col="title" label={t(locale, "shell.colTitle")} />
                </th>
                <th className="px-2 py-2 font-medium">
                  <SortLink col="status" label={t(locale, "shell.colStatus")} />
                </th>
                <th className="px-2 py-2 font-medium">
                  <SortLink col="deadline" label={t(locale, "shell.colDeadline")} />
                </th>
                {!isSupplier ? (
                  <th className="px-2 py-2 font-medium">
                    <SortLink col="offers" label={t(locale, "shell.colOffers")} />
                  </th>
                ) : (
                  <>
                    <th className="px-2 py-2 font-medium">{t(locale, "shell.colMyOffer")}</th>
                    <th className="px-2 py-2 font-medium">{t(locale, "shell.colReceipt")}</th>
                  </>
                )}
                <th className="px-2 py-2 font-medium md:pr-5">{t(locale, "shell.colSeal")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const status = effectiveStatus(row, now);
                const seal = sealStateOf(row);
                return (
                  <tr key={row.id} className="border-b border-line/60 transition-colors hover:bg-paper-2">
                    <td className="px-4 py-2.5 md:px-6">
                      <Link href={`/appels-offres/${row.id}`} className="num font-medium text-cobalt hover:underline">
                        {row.number}
                      </Link>
                    </td>
                    <td className="max-w-[280px] px-2.5 py-2.5">
                      <Link href={`/appels-offres/${row.id}`} className="block truncate font-medium text-ink hover:underline">
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <StatusPill status={status} locale={locale} />
                    </td>
                    <td className="px-2.5 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="num text-[12px] font-medium text-cobalt">
                          {(() => {
                            const d = daysUntil(row.deadline);
                            return d >= 0
                              ? t(locale, "lists.daysLeft", { n: d })
                              : t(locale, "lists.expired", { n: -d });
                          })()}
                        </span>
                        <span className="num text-[11px] text-ink-soft">{formatDateTime(row.deadline, locale)}</span>
                      </div>
                    </td>
                    {!isSupplier ? (
                      <td className="num px-2 py-2 text-ink">
                        {row.bidCount}/{row.inviteCount}
                      </td>
                    ) : (
                      <>
                        <td className="px-2.5 py-2.5">
                          {row.myOfferSealed ? (
                            <span className="inline-flex items-center gap-1 text-cobalt">
                              <SealMark size={14} />
                              {t(locale, "shell.offerSealed")}
                            </span>
                          ) : (
                            <span className="text-ink-soft">{t(locale, "shell.offerNone")}</span>
                          )}
                        </td>
                        <td className="num px-2 py-2 text-ink-soft">
                          {row.myOfferSubmittedAt
                            ? `${formatDate(row.myOfferSubmittedAt, locale)} · ${formatTime(row.myOfferSubmittedAt, locale)}`
                            : "—"}
                        </td>
                      </>
                    )}
                    <td className="px-2.5 py-2.5 md:pr-6">
                      <SealMark
                        state={seal}
                        size={18}
                        title={t(locale, seal === "opened" ? "seal.opened" : seal === "one" ? "seal.oneKey" : "seal.sealed")}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
