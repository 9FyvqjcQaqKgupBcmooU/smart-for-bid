import Link from "next/link";
import { AOPane } from "@/components/panes/AOPane";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function TenderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const locale = await getLocale();
  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="flex shrink-0 items-center gap-3 border-b border-line/70 px-4 py-2 md:px-6">
        <Link href="/" className="text-[13px] font-medium text-cobalt hover:underline">
          ← {t(locale, "shell.backToList")}
        </Link>
      </div>
      <div className="min-h-0 flex-1 md:overflow-hidden">
        <AOPane id={id} tab={tab} />
      </div>
    </div>
  );
}
