import { formatParisStamp } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";
import { auditActionLabel } from "@/lib/audit-labels";
import { shortHash, type ChainedEvent } from "@/lib/audit-chain";
import Link from "next/link";

export function AuditJournal({
  locale,
  chain,
  intact,
  tipHash,
  brokenAt,
  tenderId,
  officers,
}: {
  locale: Locale;
  chain: ChainedEvent[]; // newest first for display
  intact: boolean;
  tipHash: string;
  brokenAt?: string;
  tenderId: string;
  officers: string;
}) {
  const display = [...chain].reverse();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">{t(locale, "shell.chainTitle")}</h2>
          <p className="text-[12px] font-medium text-ink/65">{t(locale, "shell.chainHint")}</p>
        </div>
        <Link
          href={`/appels-offres/${tenderId}/preuve.pdf`}
          className="ml-auto inline-flex min-h-9 items-center rounded-full bg-cobalt px-3.5 text-[13px] font-semibold text-paper hover:opacity-90"
        >
          {t(locale, "shell.exportProof")}
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <ol className="space-y-0">
          {display.map((ev) => (
            <li key={ev.id} className="grid grid-cols-[14px_1fr] gap-3 border-b border-line/70 py-3 last:border-0">
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${intact || ev.id !== brokenAt ? "bg-cobalt" : "bg-[#B91C1C]"}`} />
              <div>
                <p className="text-[13px] font-semibold text-ink">{auditActionLabel(ev.action)}</p>
                <p className="mt-0.5 text-[12px] font-medium text-ink/70">
                  {formatParisStamp(ev.createdAt, locale)} · {ev.actorName} · {ev.orgName}
                </p>
                <p className="num mt-2 break-all rounded-md bg-paper-2 px-2 py-1.5 text-[10px] font-medium text-ink/70">
                  prev: {shortHash(ev.prevHash)} → hash: {ev.hash}
                </p>
              </div>
            </li>
          ))}
          {display.length === 0 ? <p className="text-[13px] text-ink/65">Aucun événement.</p> : null}
        </ol>
        <aside className="rounded-xl border border-line bg-paper p-4">
          <h3 className="text-[13px] font-semibold text-ink">{t(locale, "shell.integrity")}</h3>
          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex justify-between gap-3 border-b border-line/70 py-1.5">
              <dt className="font-medium text-ink/65">Événements liés</dt>
              <dd className="num font-semibold text-ink">{chain.length}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-line/70 py-1.5">
              <dt className="font-medium text-ink/65">Racine / pointe</dt>
              <dd className="num font-semibold text-ink">{shortHash(tipHash)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-line/70 py-1.5">
              <dt className="font-medium text-ink/65">Vérification</dt>
              <dd className={`font-semibold ${intact ? "text-[#0F766E]" : "text-[#B91C1C]"}`}>
                {intact ? t(locale, "shell.chainIntact") : t(locale, "shell.chainBroken")}
              </dd>
            </div>
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="font-medium text-ink/65">Officiers d&apos;ouverture</dt>
              <dd className="text-right font-semibold text-ink">{officers}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] leading-[18px] text-ink/65">
            Chaque événement porte le hash du précédent. Toute altération casse la chaîne — exportable en preuve PDF.
          </p>
        </aside>
      </div>
    </div>
  );
}
