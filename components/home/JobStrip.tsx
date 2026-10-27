import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { Chip } from "@/components/Chip";

export type JobStripProps = {
  locale: Locale;
  role: string;
  itemKey?: string;
  canCreate?: boolean;
  canSubmit?: boolean;
};

export function JobStrip({ locale, role, itemKey, canCreate, canSubmit }: JobStripProps) {
  const base = itemKey ? `/?item=${encodeURIComponent(itemKey)}` : "/";
  const isSupplier = role === "VENDOR";

  if (isSupplier) {
    return (
      <div className="flex flex-wrap gap-x-1.5 px-4 pb-1.5 max-md:gap-y-0 md:gap-y-1.5">
        {itemKey ? (
          <>
            <Link className="inline-flex min-h-11 items-center md:min-h-0" href={`${base}&tab=brief`}>
              <Chip tone="neutral">{t(locale, "home.verbBrief")}</Chip>
            </Link>
            <Link className="inline-flex min-h-11 items-center md:min-h-0" href={`${base}&tab=brief`}>
              <Chip tone="cobalt">{canSubmit ? t(locale, "home.verbSubmitOffer") : t(locale, "home.verbFollowStatus")}</Chip>
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-1.5 px-4 pb-1.5 max-md:gap-y-0 md:gap-y-1.5">
      {itemKey ? (
        <>
          <Link className="inline-flex min-h-11 items-center md:min-h-0" href={`${base}&tab=brief`}>
            <Chip tone="neutral">{t(locale, "home.verbBrief")}</Chip>
          </Link>
          <Link className="inline-flex min-h-11 items-center md:min-h-0" href={`${base}&tab=offers`}>
            <Chip tone="neutral">{t(locale, "home.verbOffers")}</Chip>
          </Link>
          <Link className="inline-flex min-h-11 items-center md:min-h-0" href={`${base}&tab=opening`}>
            <Chip tone="cobalt">{t(locale, "home.verbOpenBids")}</Chip>
          </Link>
        </>
      ) : null}
      {canCreate ? (
        <Link className="inline-flex min-h-11 items-center md:min-h-0" href="/appels-offres/nouveau">
          <Chip tone="cobalt">{t(locale, "home.verbCreateRfq")}</Chip>
        </Link>
      ) : null}
    </div>
  );
}
