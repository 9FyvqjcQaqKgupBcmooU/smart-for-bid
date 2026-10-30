import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

export function Breadcrumbs({
  locale,
  items,
}: {
  locale: Locale;
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label={t(locale, "shell.breadcrumb")} className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13px]">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex min-w-0 items-center gap-1.5">
            {i > 0 ? <span className="text-ink/40" aria-hidden>/</span> : null}
            {item.href && !last ? (
              <Link href={item.href} className="truncate font-semibold text-cobalt hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={`truncate ${last ? "font-semibold text-ink" : "text-ink/65"}`}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
