const PARIS = "Europe/Paris";

export type FormatLocale = "en" | "fr" | string;

function tag(locale: FormatLocale = "en") {
  return locale === "fr" ? "fr-FR" : "en-GB";
}

/** Short person label for chips/ceremony. Keeps demo form "Given I." — never bare given name. */
export function firstName(name: string): string {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name;
  if (parts.length >= 2 && /^[A-Za-zÀ-ÿ]\.?$/.test(parts[1])) {
    return `${parts[0]} ${parts[1].replace(/\.$/, "")}.`;
  }
  // Companies / full names: leave intact (do not invent an initial).
  return trimmed;
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

export function formatTime(d: Date | string | null | undefined, locale: FormatLocale = "en"): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(tag(locale), {
    timeZone: PARIS,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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
    hour12: false,
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

/** Stamp: 31 Oct 2026 · 10:00 Paris time (Europe/Paris, never Z). */
export function formatParisStamp(d: Date | string | null | undefined, locale: FormatLocale = "en"): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const day = new Intl.DateTimeFormat(tag(locale), {
    timeZone: PARIS,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat(tag(locale), {
    timeZone: PARIS,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  const zone = locale === "fr" ? "heure de Paris" : "Paris time";
  return `${day} · ${time} ${zone}`;
}
