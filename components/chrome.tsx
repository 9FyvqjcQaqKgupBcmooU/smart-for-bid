import Link from "next/link";
import type { ReactNode } from "react";
import { Money } from "./Money";
import { Explain } from "./Explain";
import { cn, formatEUR } from "@/lib/format";
import type { CostTrail } from "@/lib/costs";
import { formatCostLine } from "@/lib/costs";
import { t, type Locale } from "@/lib/i18n";

function desktopLeftWidth(cls: string) {
  return cls
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => {
      if (
        c.startsWith("md:") ||
        c.startsWith("max-md:") ||
        c.startsWith("sm:") ||
        c.startsWith("lg:")
      ) {
        return c;
      }
      if (c.startsWith("w-")) return `md:${c}`;
      return c;
    })
    .join(" ");
}

export function Workbench({
  left,
  right,
  toolbar,
  leftClassName = "w-[272px]",
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  toolbar?: React.ReactNode;
  leftClassName?: string;
}) {
  return (
    <div className="flex flex-col md:h-full md:min-h-0">
      {toolbar}
      <div className="flex flex-col md:min-h-0 md:flex-1 md:flex-row">
        <aside
          className={cn(
            "flex min-h-0 w-full shrink-0 flex-col overflow-x-hidden border-line/70 bg-paper-2 max-md:border-b md:h-full md:w-[272px] md:overflow-hidden md:border-b-0 md:border-r",
            desktopLeftWidth(leftClassName)
          )}
        >
          <div className="min-h-0 md:h-full md:flex-1 md:overflow-y-auto">{left}</div>
        </aside>
        <section className="min-w-0 overflow-x-hidden bg-paper md:flex md:min-h-0 md:flex-1 md:flex-col md:overflow-hidden">
          {right}
        </section>
      </div>
    </div>
  );
}

export function TaxLine({
  locale,
  ht,
  ttc,
  vatRate,
  wht,
  lead = "ht",
}: {
  locale: Locale;
  ht?: number | null;
  ttc?: number | null;
  vatRate?: number | null;
  wht?: number | null;
  lead?: "ht" | "ttc";
}) {
  const vat =
    vatRate != null && vatRate !== 0 ? (
      <Explain tip={t(locale, "learn.vat")}>{t(locale, "caption.vatPct", { pct: String(vatRate) })}</Explain>
    ) : null;
  const whtNode =
    wht != null && wht > 0 ? (
      <>
        {" · "}
        <Explain tip={t(locale, "learn.wht")}>{t(locale, "caption.whtAmt", { amount: formatEUR(wht, locale) })}</Explain>
      </>
    ) : null;
  if (lead === "ht" && ttc != null) {
    return (
      <>
        {formatEUR(ttc, locale)} {t(locale, "caption.with")} {vat}
        {whtNode}
      </>
    );
  }
  return (
    <>
      {ht != null && (
        <>
          {formatEUR(ht, locale)}{" "}
          <Explain tip={t(locale, locale === "fr" ? "learn.ht" : "learn.exclTax")}>{t(locale, "caption.beforeTax")}</Explain>
        </>
      )}
      {ht != null && vat ? " · " : null}
      {vat}
      {whtNode}
    </>
  );
}

export type PersonChip = { name: string; hint?: string; active?: boolean };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export { Chip } from "./Chip";

export function PeopleChips({ people }: { people: PersonChip[] }) {
  if (!people.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center">
      {people.map((p, i) => (
        <span
          key={`${p.name}-${i}`}
          title={p.hint}
          style={{ zIndex: people.length - i }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-[12px] ring-2 ring-paper",
            p.active ? "bg-cobalt-soft" : "bg-paper-2",
            i > 0 && "-ml-3"
          )}
        >
          <span
            className={cn(
              "grid h-[22px] w-[22px] place-items-center rounded-full text-[10px] font-medium",
              p.active ? "bg-cobalt text-paper" : "bg-paper-2 text-ink"
            )}
          >
            {initials(p.name)}
          </span>
          <span className={p.active ? "font-medium text-ink" : "text-ink"}>{p.name.split(/\s+/)[0]}</span>
        </span>
      ))}
    </div>
  );
}

export function FileLink({ href, label, hint }: { href: string; label: string; hint?: string }) {
  return (
    <Link href={href} className="flex items-start gap-2 rounded-md px-1 py-1.5 hover:bg-paper">
      <span className="mt-0.5 h-4 w-3.5 shrink-0 rounded-[2px] border border-line bg-paper" />
      <span className="min-w-0">
        <span className="block truncate text-[13px] text-ink">{label}</span>
        {hint ? <span className="block truncate text-[11px] text-ink-soft">{hint}</span> : null}
      </span>
    </Link>
  );
}

export function Decision({
  question,
  title,
  subtitle,
  amount,
  amountCaption,
  amountHint,
  context,
  costLine,
  extra,
  actions,
  upNext,
  below,
  children,
  people,
  rail,
  locale,
}: {
  question: string;
  title: string;
  subtitle?: string;
  amount?: number | null;
  amountCaption?: ReactNode;
  amountHint?: ReactNode;
  context?: string;
  costLine?: string;
  extra?: ReactNode;
  actions?: ReactNode;
  upNext?: ReactNode;
  below?: ReactNode;
  children?: ReactNode;
  people?: PersonChip[];
  rail?: ReactNode;
  locale: Locale;
  /** Compact 5-node cycle. Omit to derive from the route; `null` = none current. */
  pipelineIndex?: number | null;
}) {
  const sentence = costLine || context;
  const hasRail = rail != null && rail !== false;
  const job = Boolean(question && question !== title);
  const hasFooter = (extra != null && extra !== false) || Boolean(actions);
  return (
    <div className="flex min-h-0 flex-col md:h-full md:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper">
        <header className="shrink-0 border-b border-line/70 px-5 pt-5 pb-4 md:px-8 md:pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3 md:flex-nowrap md:gap-6">
            <div className="min-w-0">
              <h2 className="text-[20px] font-medium leading-snug tracking-tight text-ink">
                {job ? question : title}
              </h2>
              {(job || subtitle) && (
                <p className="mt-1 text-[14px] text-ink-soft md:truncate">
                  {job ? (
                    <>
                      {title}
                      {subtitle ? ` · ${subtitle}` : ""}
                    </>
                  ) : (
                    subtitle
                  )}
                </p>
              )}
              {sentence ? (
                <p className="mt-1.5 text-[13px] leading-[18px] text-ink-soft">{sentence}</p>
              ) : null}
              {amountHint != null && amountHint !== false ? (
                <p className="mt-1 text-[13px] leading-[18px] text-ink-soft">{amountHint}</p>
              ) : null}
            </div>
            {amount != null && (
              <div className="shrink-0 text-right">
                <p className="text-[22px] font-medium leading-none tabular text-ink">
                  <Money value={amount} locale={locale} />
                </p>
                {amountCaption != null && amountCaption !== false && (
                  <p className="mt-1 text-[12px] leading-[16px] text-ink-soft">{amountCaption}</p>
                )}
              </div>
            )}
          </div>
          {people && people.length > 0 ? <PeopleChips people={people} /> : null}
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden px-5 py-5 md:overflow-y-auto md:px-8">
          {children}
          {below ? <div className="mt-4">{below}</div> : null}
        </div>
        {hasFooter && (
          <div className="shrink-0 border-t border-line/70 px-5 py-4 md:px-8">
            {extra != null && extra !== false ? (
              <div className={actions ? "mb-3" : undefined}>{extra}</div>
            ) : null}
            {actions ? <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{actions}</div> : null}
            {upNext != null && upNext !== false ? (
              <p className="mt-2 text-[13px] leading-[18px] text-ink-soft">{upNext}</p>
            ) : null}
          </div>
        )}
      </div>
      {hasRail && (
        <aside className="hidden w-[240px] shrink-0 flex-col overflow-hidden border-l border-line bg-paper-2 md:flex">
          <p className="shrink-0 px-4 pt-4 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">
            {t(locale, "chrome.related")}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">{rail}</div>
        </aside>
      )}
    </div>
  );
}

export function DocHead({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-line/70 px-6 py-4">
      <span className="text-[13px] text-ink-soft">{kicker}</span>
      <h1 className="min-w-0 truncate text-[15px] font-medium">{title}</h1>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  );
}

export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-3 border-t border-line/70 bg-paper px-6 py-4">
      {children}
    </div>
  );
}

export function CostStrip({ trail, compact = false, locale = "en" }: { trail: CostTrail; compact?: boolean; locale?: Locale }) {
  const line = formatCostLine(trail, locale);
  if (!line && !compact) return null;
  const scream = trail.delta > 0.005 && trail.invoiced > 0;
  return (
    <div className={cn("shrink-0 px-7 py-2 text-[15px] leading-[22px]", scream ? "text-danger" : "text-ink-soft")}>
      {line}
      {trail.ttc != null && (
        <span className="ml-2 tabular text-ink-soft">
          · <Explain tip={t(locale, "learn.inclTax")}>{t(locale, "cost.inclVat")}</Explain>{" "}
          <Money value={trail.ttc} locale={locale} />
        </span>
      )}
    </div>
  );
}

export function UpNext({
  locale,
  href,
  label,
}: {
  locale: Locale;
  href?: string;
  label: string;
}) {
  const text = `${t(locale, "chrome.upNext")}: ${label}`;
  if (!href) return <>{text}</>;
  return (
    <Link href={href} className="underline hover:text-ink">
      {text}
    </Link>
  );
}

export function btnPrimary(extra = "") {
  return cn(
    "inline-flex min-h-11 items-center justify-center rounded-full bg-cobalt px-6 text-[16px] font-medium text-paper shadow-[0_1px_2px_rgba(29,78,216,0.28)] hover:opacity-90 disabled:opacity-40",
    extra
  );
}
export function btnGhost(extra = "") {
  return cn(
    "inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-paper px-5 text-[16px] font-medium text-ink hover:bg-paper-2 disabled:opacity-40",
    extra
  );
}
export function btnDanger(extra = "") {
  return cn(
    "inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-paper px-5 text-[16px] font-medium text-ink-soft hover:bg-paper-2 disabled:opacity-40",
    extra
  );
}

export function ListToolbar({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-11 shrink-0 items-center justify-between px-4 py-3">
      <p className="text-[13px] text-ink-soft">{title}</p>
      {action}
    </div>
  );
}

export function EmptyPane({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div>
        <p className="text-[22px] font-medium leading-snug">{title}</p>
        {hint && <p className="mt-2 text-[15px] leading-[22px] text-ink-soft">{hint}</p>}
      </div>
    </div>
  );
}

export function Row({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "soft-card mx-3 mb-2 block px-4 py-3 text-[15px] hover:shadow-[0_2px_8px_rgba(15,23,42,0.08)]",
        active && "ring-1 ring-cobalt/20"
      )}
    >
      {children}
    </Link>
  );
}
