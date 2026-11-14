"use client";

import { useMemo, useState } from "react";
import { formatParisStamp } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

/** Date + time (24h) fields that sync into a single datetime-local hidden value. */
export function DeadlineField({
  name = "deadline",
  defaultValue,
  locale = "en",
  label,
}: {
  name?: string;
  defaultValue: string; // yyyy-MM-ddTHH:mm
  locale?: Locale;
  label: string;
}) {
  const [date, setDate] = useState(defaultValue.slice(0, 10));
  const [time, setTime] = useState(defaultValue.slice(11, 16) || "17:00");
  const combined = `${date}T${time}`;
  const preview = useMemo(() => {
    try {
      return formatParisStamp(new Date(combined), locale);
    } catch {
      return "—";
    }
  }, [combined, locale]);

  return (
    <label className="text-[14px]">
      {label}
      <div className="mt-0.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="date"
          lang="en-GB"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="min-h-10 w-full rounded-xl border border-line bg-paper px-3 py-2 text-[14px] num"
        />
        <input
          type="time"
          lang="en-GB"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="min-h-10 w-full rounded-xl border border-line bg-paper px-3 py-2 text-[14px] num"
        />
      </div>
      <input type="hidden" name={name} value={combined} />
      <p className="mt-1 text-[12px] text-ink-soft">{preview}</p>
    </label>
  );
}
