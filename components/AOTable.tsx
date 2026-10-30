import Link from "next/link";
import { StatusPill } from "./StatusPill";
import { SealMark, sealStateOf } from "./SealMark";
import { EmptyState } from "./EmptyState";
import { cn, formatParisStamp, daysUntil, formatEUR } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";

export type AORow = {
  id: string;
  number: string;
  title: string;
  category?: string;
  status: string;
  deadline: Date;
  bidCount: number;
  inviteCount: number;
  keyAUnlocked: boolean;
  keyBUnlocked: boolean;
  budget?: number | null;
  myOfferSubmittedAt?: Date | null;
  myOfferSealed?: boolean;
};

export type KpiStats = {
  openCount: number;
  amountUnder: number;
  offersMonth: number;
  avgAwardDays: number | null;
  savingsPct: number | null;
};

type ViewId = "all" | "draft" | "published" | "sealed" | "opened" | "awarded";

function effectiveStatus(row: AORow, now: number) {
  if (row.status === "published" && row.deadline.getTime() <= now) return "closed";
  return row.status;
}

function matchesView(row: AORow, view: ViewId, now: number) {
  const st = effectiveStatus(row, now);
  if (view === "all") return true;
  if (view === "draft") return st === "draft";
  if (view === "published") return st === "published";
  if (view === "sealed") return st === "closed" || (st === "published" && row.bidCount > 0);
  if (view === "opened") return st === "opened";
  if (view === "awarded") return st === "awarded";
  return true;
}

function hrefFor(view: ViewId, sort: string, dir: "asc" | "desc", q?: string) {
  const sp = new URLSearchParams();
  if (view !== "all") sp.set("view", view);
  if (q) sp.set("q", q);
  if (sort !== "deadline") sp.set("sort", sort);
  if (dir !== "asc") sp.set("dir", dir);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

function deadlineLabel(locale: Locale, deadline: Date, status: string) {
  if (status === "awarded" || status === "opened") {
    return <span className="text-[12px] text-ink/65">{formatParisStamp(deadline, locale)}</span>;
  }
  const d = daysUntil(deadline);
  if (d > 0) return <span className="num text-[12px] font-semibold text-cobalt">{t(locale, "shell.daysLeft", { n: d })}</span>;
  if (d === 0) return <span className="num text-[12px] font-semibold text-cobalt">{t(locale, "shell.dueToday")}</span>;
  return <span className="num text-[12px] font-semibold text-ink">{t(locale, "shell.duePassed")}</span>;
}


function SortLink({
  col,
  label,
  sort,
  dir,
  view,
  q,
}: {
  col: string;
  label: string;
  sort: string;
  dir: "asc" | "desc";
  view: string;
  q?: string;
}) {
  const active = sort === col;
  const nextDir = sort === col && dir === "asc" ? "desc" : "asc";
  const sp = new URLSearchParams();
  if (view !== "all") sp.set("view", view);
  if (q) sp.set("q", q);
  sp.set("sort", col);
  sp.set("dir", nextDir);
  return (
    <Link href={`/?${sp.toString()}`} className={cn("inline-flex items-center gap-1 hover:text-ink", active ? "text-ink" : "text-ink/60")}>
      {label}
      <span className="num text-[10px]">{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
    </Link>
  );
}

export function AOTable({
  rows,
  locale,
  isSupplier,
  canCreate,
  view = "all",
  sort = "deadline",
  dir = "asc",
  q,
  now,
  kpis,
}: {
  rows: AORow[];
  locale: Locale;
  isSupplier: boolean;
  canCreate: boolean;
  view?: string;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  now: number;
  kpis?: KpiStats;
}) {
  const v = (view as ViewId) || "all";
  const views: { id: ViewId; label: string; hide?: boolean }[] = [
    { id: "all", label: t(locale, "shell.viewsAll") },
    { id: "draft", label: t(locale, "shell.viewsDraft"), hide: isSupplier },
    { id: "published", label: t(locale, "shell.viewsPublished") },
    { id: "sealed", label: t(locale, "shell.viewsSealed") },
    { id: "opened", label: t(locale, "shell.viewsOpened") },
    { id: "awarded", label: t(locale, "shell.viewsAwarded") },
  ];

  const filtered = rows.filter((r) => {
    if (!matchesView(r, v, now)) return false;
    if (q) {
      const hay = `${r.number} ${r.title} ${r.category ?? ""}`.toLowerCase();
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
    if (sort === "budget") return mul * ((a.budget ?? 0) - (b.budget ?? 0));
    return mul * (a.deadline.getTime() - b.deadline.getTime());
  });

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-4 py-3 md:px-6">
        <h1 className="text-[17px] font-semibold tracking-tight text-ink">
          {isSupplier ? t(locale, "shell.dashboardSupplier") : t(locale, "shell.dashboard")}
        </h1>
        <span className="num text-[12px] font-medium text-ink/60">{sorted.length}</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canCreate ? (
            <Link href="/appels-offres/nouveau" className="inline-flex min-h-9 items-center rounded-full bg-cobalt px-3.5 text-[13px] font-semibold text-paper hover:opacity-90">
              {t(locale, "shell.newRfq")}
            </Link>
          ) : null}
        </div>
      </div>

      {!isSupplier && kpis ? (
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-line bg-paper px-3 py-3 sm:grid-cols-3 md:grid-cols-5 md:px-6">
          {[
            { label: t(locale, "shell.kpiOpen"), value: String(kpis.openCount), hint: t(locale, "shell.kpiOpenHint") },
            { label: t(locale, "shell.kpiAmount"), value: formatEUR(kpis.amountUnder, locale).replace(/\s/g, "\u00a0"), hint: t(locale, "shell.kpiAmountHint") },
            { label: t(locale, "shell.kpiOffers"), value: String(kpis.offersMonth), hint: t(locale, "shell.kpiOffersHint") },
            { label: t(locale, "shell.kpiCycle"), value: kpis.avgAwardDays != null ? `${kpis.avgAwardDays} j` : "—", hint: t(locale, "shell.kpiCycleHint") },
            { label: t(locale, "shell.kpiSavings"), value: kpis.savingsPct != null ? `${kpis.savingsPct > 0 ? "−" : ""}${Math.abs(kpis.savingsPct).toFixed(1).replace(".", ",")} %` : "—", hint: t(locale, "shell.kpiSavingsHint"), accent: true },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-line bg-paper px-3 py-2.5">
              <div className="text-[11px] font-semibold text-ink/65">{k.label}</div>
              <div className={cn("num mt-0.5 text-[18px] font-semibold tracking-tight", k.accent ? "text-[#0F766E]" : "text-ink")}>{k.value}</div>
              <div className="mt-0.5 text-[11px] text-ink/55">{k.hint}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex shrink-0 items-center gap-0 overflow-x-auto border-b border-line px-2 md:px-4" role="tablist">
        {views.filter((x) => !x.hide).map((tab) => {
          const count = rows.filter((r) => matchesView(r, tab.id, now)).length;
          const active = v === tab.id;
          return (
            <Link
              key={tab.id}
              role="tab"
              aria-selected={active}
              href={hrefFor(tab.id, sort, dir, q)}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-[13px] font-semibold transition-colors",
                active ? "text-cobalt" : "text-ink/65 hover:text-ink"
              )}
            >
              {tab.label}
              <span className={cn("num ml-1.5 text-[11px]", active ? "text-cobalt" : "text-ink/50")}>{count}</span>
              {active ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-cobalt" /> : null}
            </Link>
          );
        })}
      </div>

      <form action="/" method="get" className="border-b border-line px-3 py-2 md:hidden">
        {v !== "all" ? <input type="hidden" name="view" value={v} /> : null}
        <input name="q" type="search" defaultValue={q} placeholder={t(locale, "shell.searchPlaceholder")} className="min-h-10 w-full rounded-full border border-line bg-paper-2 px-3.5 text-[14px] text-ink" />
      </form>

      <div className="min-h-0 flex-1 overflow-auto">
        {sorted.length === 0 ? (
          <EmptyState
            title={rows.length === 0 ? (isSupplier ? t(locale, "shell.emptySupplier") : t(locale, "shell.emptyClient")) : t(locale, "shell.emptyFiltered")}
            hint={canCreate && rows.length === 0 ? t(locale, "shell.emptyHint") : undefined}
          />
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-paper-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/60">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 md:px-6"><SortLink sort={sort} dir={dir} view={v} q={q} col="ref" label={t(locale, "shell.colRef")} /></th>
                <th className="px-2 py-2"><SortLink sort={sort} dir={dir} view={v} q={q} col="title" label={t(locale, "shell.colTitle")} /></th>
                <th className="px-2 py-2"><SortLink sort={sort} dir={dir} view={v} q={q} col="status" label={t(locale, "shell.colStatus")} /></th>
                <th className="px-2 py-2"><SortLink sort={sort} dir={dir} view={v} q={q} col="deadline" label={t(locale, "shell.colDeadline")} /></th>
                {!isSupplier ? (
                  <>
                    <th className="px-2 py-2"><SortLink sort={sort} dir={dir} view={v} q={q} col="offers" label={t(locale, "shell.colOffers")} /></th>
                    <th className="px-2 py-2">{t(locale, "shell.colSeal")}</th>
                    <th className="px-2 py-2 md:pr-5"><SortLink sort={sort} dir={dir} view={v} q={q} col="budget" label={t(locale, "shell.colBudget")} /></th>
                  </>
                ) : (
                  <>
                    <th className="px-2 py-2">{t(locale, "shell.colMyOffer")}</th>
                    <th className="px-2 py-2">{t(locale, "shell.colReceipt")}</th>
                    <th className="px-2 py-2 md:pr-5">{t(locale, "shell.colSeal")}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const status = effectiveStatus(row, now);
                const seal = sealStateOf(row);
                const href = `/appels-offres/${row.id}`;
                return (
                  <tr key={row.id} className="border-b border-line/70 transition-colors hover:bg-paper-2">
                    <td className="px-4 py-2.5 md:px-6">
                      <Link href={href} className="num font-medium text-cobalt hover:underline">{row.number}</Link>
                    </td>
                    <td className="max-w-[280px] px-2.5 py-2.5">
                      <Link href={href} className="block truncate font-semibold text-ink hover:underline">{row.title}</Link>
                      {row.category ? <div className="truncate text-[11px] text-ink/55">{row.category}</div> : null}
                    </td>
                    <td className="px-2.5 py-2.5"><StatusPill status={status} locale={locale} /></td>
                    <td className="px-2.5 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        {deadlineLabel(locale, row.deadline, status)}
                        <span className="num text-[11px] text-ink/55">{formatParisStamp(row.deadline, locale)}</span>
                      </div>
                    </td>
                    {!isSupplier ? (
                      <>
                        <td className="num px-2 py-2 font-medium text-ink">{row.bidCount}/{row.inviteCount}</td>
                        <td className="px-2.5 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink/70">
                            <SealMark state={seal} size={16} />
                            {seal === "opened" ? "Ouvert" : seal === "one" ? "1/2" : "Scellé"}
                          </span>
                        </td>
                        <td className="num px-2.5 py-2.5 font-medium text-ink md:pr-6">
                          {row.budget != null ? formatEUR(row.budget, locale) : "—"}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2.5 py-2.5">
                          {row.myOfferSealed ? (
                            <span className="inline-flex items-center gap-1 font-medium text-cobalt">
                              <SealMark size={14} />
                              {t(locale, "shell.offerSealed")}
                            </span>
                          ) : (
                            <span className="text-ink/60">{t(locale, "shell.offerNone")}</span>
                          )}
                        </td>
                        <td className="num px-2 py-2 text-ink/65">
                          {row.myOfferSubmittedAt ? formatParisStamp(row.myOfferSubmittedAt, locale) : "—"}
                        </td>
                        <td className="px-2.5 py-2.5 md:pr-6">
                          <SealMark state={seal} size={18} />
                        </td>
                      </>
                    )}
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
