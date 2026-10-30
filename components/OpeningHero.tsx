import { formatParisStamp, formatEUR } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";
import { shortHash } from "@/lib/audit-chain";
import Link from "next/link";

type Offer = { vendor: string; price: number };

export function OpeningHero({
  locale,
  tenderId,
  number,
  title,
  openedAt,
  budget,
  officerA,
  officerB,
  unlockAAt,
  unlockBAt,
  sealBefore,
  sealAfter,
  offers,
  proofRef,
}: {
  locale: Locale;
  tenderId: string;
  number: string;
  title: string;
  openedAt: Date;
  budget: number | null;
  officerA: { name: string; title?: string };
  officerB: { name: string; title?: string };
  unlockAAt: Date | null;
  unlockBAt: Date | null;
  sealBefore: string;
  sealAfter: string;
  offers: Offer[];
  proofRef: string;
}) {
  const match = sealBefore === sealAfter;
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-cobalt text-[22px] text-paper">⬡</div>
        <h2 className="text-[15px] font-semibold text-ink">{t(locale, "shell.openingDone")}</h2>
        <p className="mt-1 text-[12px] font-medium text-ink/65">
          Deux officiers authentifiés · horodatage serveur · empreinte du pli confirmée
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { lock: "Clé A", o: officerA, at: unlockAAt, ok: "Clé A acceptée" },
          { lock: "Clé B", o: officerB, at: unlockBAt, ok: "Clé B acceptée → ouverture" },
        ].map((k) => (
          <div key={k.lock} className="rounded-xl border border-line bg-cobalt-soft/60 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/60">{k.lock}</div>
                <div className="text-[14px] font-semibold text-ink">{k.o.name}</div>
                <div className="text-[12px] font-medium text-ink/65">{k.o.title ?? "Officier d'ouverture"}</div>
              </div>
              <span className="inline-flex h-5 items-center rounded-full bg-[#ECFDF5] px-2 text-[10px] font-semibold text-[#0F766E]">
                ● Authentifié
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-[13px]">
              <div className="flex justify-between border-b border-line/60 py-1">
                <span className="text-ink/65">Déverrouillage</span>
                <span className="num font-semibold text-ink">{k.at ? formatParisStamp(k.at, locale) : "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink/65">Statut</span>
                <span className="font-semibold text-[#0F766E]">{k.ok}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-cobalt/40 bg-cobalt-soft p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink/60">{t(locale, "shell.sealFp")}</div>
        <p className="num mt-1 break-all text-[12px] font-medium text-ink">sha256: {sealAfter}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-medium text-ink/80">
          <span>{match ? "✓" : "✗"} Empreinte avant = après</span>
          <span>✓ Aucune lecture acheteur avant échéance</span>
          <span>✓ Deux personnes physiques distinctes</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-4">
          <h3 className="text-[13px] font-semibold text-ink">Offres révélées</h3>
          <ul className="mt-2">
            {offers.map((o) => (
              <li key={o.vendor} className="flex justify-between border-b border-line/60 py-2 text-[13px] last:border-0">
                <span className="font-medium text-ink">{o.vendor}</span>
                <span className="num font-semibold text-ink">{formatEUR(o.price, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-paper p-4">
          <h3 className="text-[13px] font-semibold text-ink">{t(locale, "shell.proofReceipt")}</h3>
          <dl className="mt-2 space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-2 border-b border-line/60 py-1.5">
              <dt className="text-ink/65">Réf. preuve</dt>
              <dd className="num font-semibold text-ink">{proofRef}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-line/60 py-1.5">
              <dt className="text-ink/65">Ouverture</dt>
              <dd className="num font-semibold text-ink">{formatParisStamp(openedAt, locale)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-line/60 py-1.5">
              <dt className="text-ink/65">AO</dt>
              <dd className="font-semibold text-ink">{number}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1.5">
              <dt className="text-ink/65">Résultat</dt>
              <dd className="font-semibold text-[#0F766E]">Sceau intact · offres ouvertes</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/appels-offres/${tenderId}/preuve.pdf`} className="inline-flex min-h-9 items-center rounded-full bg-cobalt px-3.5 text-[13px] font-semibold text-paper">
              {t(locale, "shell.exportProof")}
            </Link>
            <Link href={`/appels-offres/${tenderId}?tab=historique`} className="inline-flex min-h-9 items-center rounded-full border border-line px-3.5 text-[13px] font-semibold text-ink">
              Voir le journal
            </Link>
          </div>
          {budget != null ? (
            <p className="mt-2 text-[12px] text-ink/60">Budget {formatEUR(budget, locale)} · {title}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-ink/50">pointe {shortHash(sealAfter)}</p>
        </div>
      </div>
    </div>
  );
}
