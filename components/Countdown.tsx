"use client";

import { useEffect, useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/format";

function parts(ms: number) {
  const totalMin = Math.floor(Math.abs(ms) / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  return { d, h, m };
}

export function formatSpan(ms: number, locale: Locale, withMinutes = true) {
  const { d, h, m } = parts(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  const D = t(locale, "countdown.d");
  const H = t(locale, "countdown.h");
  const M = t(locale, "countdown.m");
  const bits: string[] = [];
  if (d > 0) bits.push(`${d}${D}`);
  bits.push(`${d > 0 ? pad(h) : h}${H}`);
  if (withMinutes || d === 0) bits.push(`${pad(m)}${M}`);
  return bits.join(" ");
}

/** Live countdown to an RFQ deadline, in IBM Plex Mono. */
export function Countdown({
  deadline,
  locale,
  className,
  now: initialNow,
}: {
  deadline: string;
  locale: Locale;
  className?: string;
  now: number;
}) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 15000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  const ms = new Date(deadline).getTime() - now;
  const past = ms <= 0;
  const span = formatSpan(ms, locale, !past);
  return (
    <span
      className={cn(
        "inline-flex leading-none max-md:items-baseline max-md:gap-2 md:flex-col md:items-end",
        className
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-soft">
        {past ? t(locale, "countdown.closedLabel") : t(locale, "countdown.closesIn")}
      </span>
      <span
        suppressHydrationWarning
        className={cn("num text-[15px] font-medium md:mt-1 md:text-[18px]", past ? "text-ink-soft" : "text-cobalt")}
      >
        {past ? t(locale, "countdown.closed", { time: span }) : span}
      </span>
    </span>
  );
}
