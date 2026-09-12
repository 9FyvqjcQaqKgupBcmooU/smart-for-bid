import { cn } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";

const TONE: Record<string, string> = {
  draft: "bg-paper-2 text-ink-soft",
  published: "bg-cobalt-soft text-cobalt",
  closed: "bg-paper-2 text-ink-soft",
  opened: "bg-cobalt-soft text-moss",
  awarded: "bg-cobalt-soft text-moss",
  pending: "bg-slate-soft text-slate",
  waiting: "bg-paper-2 text-ink-soft",
  approved: "bg-cobalt-soft text-moss",
  rejected: "bg-danger-soft text-danger",
  ordered: "bg-cobalt-soft text-cobalt",
  issued: "bg-cobalt-soft text-cobalt",
  partially_received: "bg-slate-soft text-slate",
  received: "bg-cobalt-soft text-moss",
  cancelled: "bg-danger-soft text-danger",
  extracted: "bg-cobalt-soft text-cobalt",
  matched: "bg-cobalt-soft text-moss",
  mismatch: "bg-danger-soft text-danger",
  scheduled: "bg-slate-soft text-slate",
  paid: "bg-cobalt-soft text-moss",
  open: "bg-slate-soft text-slate",
  executed: "bg-cobalt-soft text-moss",
  confirmed: "bg-cobalt-soft text-moss",
  skipped: "bg-paper-2 text-ink-soft",
  RECURRING: "bg-paper-2 text-ink-soft",
  ONE_OFF: "bg-paper-2 text-ink-soft",
  GOODS: "bg-cobalt-soft text-cobalt",
  SERVICE: "bg-paper-2 text-ink-soft",
};

export function StatusPill({ status, locale = "en" }: { status: string; locale?: Locale }) {
  const key = `status.${status}`;
  const translated = t(locale, key);
  const label = translated === key ? status : translated;
  const className = TONE[status] ?? "bg-paper-2 text-ink";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-[3px] text-[12px] font-medium leading-4", className)}>
      {label}
    </span>
  );
}
