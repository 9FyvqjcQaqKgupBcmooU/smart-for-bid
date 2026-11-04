/** "YYYY-MM-DDTHH:mm" in Europe/Paris for a datetime-local input. */
export function toParisLocalInput(d: Date): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

/** Interpret a datetime-local value as Europe/Paris wall time. */
export function parisLocalToDate(v: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return null;
  const base = v.slice(0, 16);
  for (const off of ["+01:00", "+02:00"]) {
    const d = new Date(`${base}:00${off}`);
    if (toParisLocalInput(d) === base) return d;
  }
  return null;
}
