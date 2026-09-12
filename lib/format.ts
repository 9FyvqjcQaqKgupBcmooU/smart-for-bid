const PARIS = "Europe/Paris";

export type FormatLocale = "en" | "fr" | string;

function tag(locale: FormatLocale = "en") {
  return locale === "fr" ? "fr-FR" : "en-GB";
}

export function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || name;
}

export function formatEUR(amount: number | null | undefined, locale: FormatLocale = "en"): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const whole = Math.abs(amount - Math.round(amount)) < 0.005;
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number, digits = 2, locale: FormatLocale = "en"): string {
  return new Intl.NumberFormat(tag(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatDate(d: Date | string | null | undefined, locale: FormatLocale = "en"): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(tag(locale), {
    timeZone: PARIS,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined, locale: FormatLocale = "en"): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(tag(locale), {
    timeZone: PARIS,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateLong(d: Date | string | null | undefined, locale: FormatLocale = "en"): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(tag(locale), {
    timeZone: PARIS,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function daysUntil(d: Date | string): number {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function agingDays(d: Date | string): number {
  const date = typeof d === "string" ? new Date(d) : d;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
