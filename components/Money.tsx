import { formatEUR } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { Explain } from "./Explain";

export function Money({
  value,
  className = "",
  locale = "en",
  caption,
  explain,
}: {
  value: number;
  className?: string;
  locale?: Locale;
  caption?: React.ReactNode;
  explain?: string;
}) {
  const figure = <span className={`tabular ${className}`}>{formatEUR(value, locale)}</span>;
  const amount = explain ? <Explain tip={explain}>{figure}</Explain> : figure;
  if (caption == null || caption === false) return amount;
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      {amount}
      <span className="text-[13px] font-normal leading-[18px] text-ink-soft">{caption}</span>
    </span>
  );
}
