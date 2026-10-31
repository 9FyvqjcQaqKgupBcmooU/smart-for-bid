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

type ViewId = "all" | "draft" | "pending_validation" | "published" | "sealed" | "opened" | "awarded";

function effectiveStatus(row: AORow, now: number) {
  if (row.status === "published" && row.deadline.getTime() <= now) return "closed";
  return row.status;
}

function matchesView(row: AORow, view: ViewId, now: number) {
  const st = effectiveStatus(row, now);
  if (view === "all") return true;
  if (view === "draft") return st === "draft";
  if (view === "pending_validation") return st === "pending_validation";
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

function deadlinePrimary(locale: Locale, deadline: Date, status: string) {
  if (status === "awarded" || status === "opened" || status === "closed") {
    return null;
  }
  const d = daysUntil(deadline);
  // Past deadlines: stamp only (never duplicate the date on two lines).
  if (d < 0) return null;
  if (d === 0) return <span className="num text-[12px] font-semibold text-cobalt">{t(locale, "shell.dueToday")}</span>;
  return <span className="num text-[12px] font-semibold text-cobalt">{t(locale, "shell.daysLeft", { n: d })}</span>;
}

function DeadlineCell({ locale, deadline, status }: { locale: Locale; deadline: Date; status: string }) {
  const primary = deadlinePrimary(locale, deadline, status);
  const stamp = formatParisStamp(deadline, locale);
  if (!primary) {
    return <span className="num text-[12px] text-ink/65">{stamp}</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {primary}
      <span className="num text-[11px] text-ink/55">{stamp}</span>
    </div>
  );
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

function savingsDisplay(locale: Locale, pct: number | null) {
  if (pct == null) return { label: t(locale, "shell.kpiSavings"), value: "—", hint: t(locale, "shell.kpiSavingsHint"), accent: true, over: false };
  const abs = Math.abs(pct).toFixed(1).replace(".", ",");
  if (pct >= 0) {
    return {
      label: t(locale, "shell.kpiSavings"),
      value: `${abs} %`,
      hint: t(locale, "shell.kpiSavingsHint"),
      accent: true,
      over: false,
    };
  }
  return {
    label: t(locale, "shell.kpiOverBudget"),
    value: `${abs} %`,
    hint: t(locale, "shell.kpiOverBudgetHint"),
    accent: false,
    over: true,
  };
}

function MobileCard({
  row,
  locale,
  isSupplier,
  now,
}: {
  row: AORow;
  locale: Locale;
  isSupplier: boolean;
  now: number;
}) {
  const status = effectiveStatus(row, now);
  const seal = sealStateOf(row);
  const href = `/appels-offres/${row.id}`;
  const primary = deadlinePrimary(locale, row.deadline, status);
  const stamp = formatParisStamp(row.deadline, locale);

  return (
    <Link
      href={href}
      className="block rounded-2xl border border-line bg-paper px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-paper-2"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="num shrink-0 text-[12px] font-semibold tracking-tight text-cobalt">{row.number}</span>
        <StatusPill status={status} locale={locale} />
      </div>
      <p className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-5 text-ink">{row.title}</p>
      {row.category ? <p className="mt-0.5 truncate text-[11px] text-ink/55">{row.category}</p> : null}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink/70">
        <span className="inline-flex min-w-0 items-baseline gap-1.5">
          {primary ?? <span className="num text-ink/65">{stamp}</span>}
          {primary ? <span className="num text-[11px] text-ink/50">{stamp}</span> : null}
        </span>
        {!isSupplier ? (
          <>
            <span className="num font-medium text-ink">
              {row.bidCount}/{row.inviteCount} <span className="font-normal text-ink/55">{t(locale, "shell.colOffers").toLowerCase()}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-ink/70">
              <SealMark state={seal} size={14} />
              {seal === "opened" ? "Ouvert" : seal === "one" ? "1/2" : "Scellé"}
            </span>
            <span className="num ml-auto font-semibold text-ink">
              {row.budget != null ? formatEUR(row.budget, locale) : "—"}
            </span>
          </>
        ) : (
          <>
            <span className={row.myOfferSealed ? "font-medium text-cobalt" : "text-ink/60"}>
              {row.myOfferSealed ? t(locale, "shell.offerSealed") : t(locale, "shell.offerNone")}
            </span>
            <span className="num text-ink/55">
              {row.myOfferSubmittedAt ? formatParisStamp(row.myOfferSubmittedAt, locale) : "—"}
            </span>
            <span className="ml-auto">
              <SealMark state={seal} size={16} />
            </span>
          </>
        )}
      </div>
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
    { id: "pending_validation", label: t(locale, "shell.viewsPending"), hide: isSupplier },
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

  const sav = kpis ? savingsDisplay(locale, kpis.savingsPct) : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-x-hidden bg-paper">
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

      {!isSupplier && kpis && sav ? (
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-line bg-paper px-3 py-3 sm:grid-cols-3 md:grid-cols-5 md:px-6">
          {[
            { label: t(locale, "shell.kpiOpen"), value: String(kpis.openCount), hint: t(locale, "shell.kpiOpenHint") },
            { label: t(locale, "shell.kpiAmount"), value: formatEUR(kpis.amountUnder, locale).replace(/\s/g, "\u00a0"), hint: t(locale, "shell.kpiAmountHint") },
            { label: t(locale, "shell.kpiOffers"), value: String(kpis.offersMonth), hint: t(locale, "shell.kpiOffersHint") },
            { label: t(locale, "shell.kpiCycle"), value: kpis.avgAwardDays != null ? `${kpis.avgAwardDays} j` : "—", hint: t(locale, "shell.kpiCycleHint") },
            { label: sav.label, value: sav.value, hint: sav.hint, accent: sav.accent, over: sav.over },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-line bg-paper px-3 py-2.5">
              <div className="text-[11px] font-semibold text-ink/65">{k.label}</div>
              <div
                className={cn(
                  "num mt-0.5 text-[18px] font-semibold tracking-tight",
                  "over" in k && k.over ? "text-[#B45309]" : k.accent ? "text-[#0F766E]" : "text-ink"
                )}
              >
                {k.value}
              </div>
              <div className="mt-0.5 text-[11px] text-ink/55">{k.hint}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div
        className="flex shrink-0 items-center gap-0 overflow-x-auto border-b border-line px-2 [-ms-overflow-style:none] [scrollbar-width:none] md:px-4 [&::-webkit-scrollbar]:hidden"
        role="tablist"
      >
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
                "relative shrink-0 whitespace-nowrap px-3 py-2.5 text-[13px] font-semibold transition-colors",
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

      <div className="min-h-0 flex-1 overflow-auto overflow-x-hidden">
        {sorted.length === 0 ? (
          <EmptyState
            title={rows.length === 0 ? (isSupplier ? t(locale, "shell.emptySupplier") : t(locale, "shell.emptyClient")) : t(locale, "shell.emptyFiltered")}
            hint={canCreate && rows.length === 0 ? t(locale, "shell.emptyHint") : undefined}
          />
        ) : (
          <>
            {/* Mobile cards — no horizontal table clip */}
            <ul className="space-y-2.5 px-3 py-3 md:hidden">
              {sorted.map((row) => (
                <li key={row.id}>
                  <MobileCard row={row} locale={locale} isSupplier={isSupplier} now={now} />
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <table className="hidden w-full border-collapse text-left text-[13px] md:table">
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
                      <td className="whitespace-nowrap px-4 py-2.5 md:px-6">
                        <Link href={href} className="num font-medium text-cobalt hover:underline">{row.number}</Link>
                      </td>
                      <td className="max-w-[280px] px-2.5 py-2.5">
                        <Link href={href} className="block truncate font-semibold text-ink hover:underline">{row.title}</Link>
                        {row.category ? <div className="truncate text-[11px] text-ink/55">{row.category}</div> : null}
                      </td>
                      <td className="px-2.5 py-2.5"><StatusPill status={status} locale={locale} /></td>
                      <td className="px-2.5 py-2.5">
                        <DeadlineCell locale={locale} deadline={row.deadline} status={status} />
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
                          <td className="num whitespace-nowrap px-2.5 py-2.5 font-medium text-ink md:pr-6">
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
          </>
        )}
      </div>
    </div>
  );
}
