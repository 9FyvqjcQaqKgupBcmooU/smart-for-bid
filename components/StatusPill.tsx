import { cn } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";

const TONE: Record<string, string> = {
  draft: "bg-paper-2 text-ink-soft",
  pending_validation: "bg-slate-soft text-slate",
  published: "bg-cobalt text-paper",
  closed: "bg-paper-2 text-ink-soft",
  opened: "bg-cobalt text-paper",
  awarded: "bg-cobalt-soft text-cobalt ring-1 ring-inset ring-cobalt/25",
  pending: "bg-cobalt text-paper",
  waiting: "bg-paper-2 text-ink-soft",
  approved: "bg-cobalt-soft text-cobalt ring-1 ring-inset ring-cobalt/25",
  rejected: "bg-danger-soft text-danger",
  ordered: "bg-cobalt text-paper",
  issued: "bg-cobalt text-paper",
  partially_received: "bg-cobalt text-paper",
  received: "bg-cobalt-soft text-cobalt ring-1 ring-inset ring-cobalt/25",
  cancelled: "bg-danger-soft text-danger",
  extracted: "bg-cobalt text-paper",
  matched: "bg-cobalt-soft text-cobalt ring-1 ring-inset ring-cobalt/25",
  mismatch: "bg-danger-soft text-danger",
  scheduled: "bg-cobalt text-paper",
  paid: "bg-cobalt-soft text-cobalt ring-1 ring-inset ring-cobalt/25",
  open: "bg-cobalt text-paper",
  executed: "bg-cobalt-soft text-cobalt ring-1 ring-inset ring-cobalt/25",
  confirmed: "bg-cobalt-soft text-cobalt ring-1 ring-inset ring-cobalt/25",
  skipped: "bg-paper-2 text-ink-soft",
  RECURRING: "bg-paper-2 text-ink-soft",
  ONE_OFF: "bg-paper-2 text-ink-soft",
  GOODS: "bg-cobalt-soft text-cobalt",
  SERVICE: "bg-paper-2 text-ink-soft",
};

export function StatusPill({ status, locale = "fr" }: { status: string; locale?: Locale }) {
  const key = `status.${status}`;
  const translated = t(locale, key);
  const label = translated === key ? status : translated;
  const className = TONE[status] ?? "bg-paper-2 text-ink";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium leading-4", className)}>
      {label}
    </span>
  );
}
