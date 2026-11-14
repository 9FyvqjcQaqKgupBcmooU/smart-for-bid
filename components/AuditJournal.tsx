import { formatParisStamp } from "@/lib/format";
import { t, type Locale } from "@/lib/i18n";
import { auditActionLabel, parseDetails, clip } from "@/lib/audit-labels";
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
  visibleIds,
  showProof = true,
}: {
  locale: Locale;
  chain: ChainedEvent[]; // newest first for display
  intact: boolean;
  tipHash: string;
  brokenAt?: string;
  tenderId: string;
  officers: string;
  /** Supplier view: hide other suppliers' events (chain still verified on the full set). */
  visibleIds?: Set<string>;
  showProof?: boolean;
}) {
  const display = [...chain].reverse().filter((ev) => !visibleIds || visibleIds.has(ev.id));
  const postBid = display.filter((ev) => ev.action === "post_bid_change");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">{t(locale, "shell.chainTitle")}</h2>
          <p className="text-[12px] font-medium text-ink/65">{t(locale, "shell.chainHint")}</p>
        </div>
        {showProof ? <Link
          href={`/appels-offres/${tenderId}/preuve.pdf`}
          className="ml-auto inline-flex min-h-10 items-center rounded-xl bg-cobalt px-4 text-[13px] font-semibold text-paper hover:bg-cobalt/90"
        >
          {t(locale, "shell.exportProof")}
        </Link> : null}
      </div>
      {postBid.length > 0 ? (
        <div className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3" data-testid="post-bid-summary">
          <p className="text-[13px] font-semibold text-danger">
            {postBid.length} post-bid change{postBid.length > 1 ? "s" : ""} recorded
          </p>
          <p className="mt-0.5 text-[12px] text-ink/75">
            Conditions were modified after at least one bid was deposited. Each change is chained below with before/after values; bidders were asked to re-acknowledge.
          </p>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <ol className="space-y-0">
          {display.map((ev) => {
              const actionTitle =
                ev.action === "validation_ok"
                  ? `Approved by ${ev.actorName} (Approver, N+1)`
                  : auditActionLabel(ev.action);
              const d = parseDetails(ev.details);
              const isPost = ev.action === "post_bid_change";
              const isDenied = ev.action === "sealed_access_denied";
              const ver = d.version ?? d.dossierVersion;
              const vhash = d.hash ?? d.dossierHash;
              return (
            <li key={ev.id} data-action={ev.action} className={`grid grid-cols-[14px_1fr] gap-3 border-b border-line/70 py-3 last:border-0 ${isPost ? "-mx-2 rounded-lg border-danger/30 bg-danger-soft/60 px-2" : ""}`}>
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${intact || ev.id !== brokenAt ? "bg-cobalt" : "bg-clay"}`} />
              <div>
                <p className={`text-[13px] font-semibold ${isPost || isDenied ? "text-danger" : "text-ink"}`}>
                  {actionTitle}
                  {isPost && d.field ? <span className="ml-1.5 font-semibold text-ink">· {d.field}</span> : null}
                </p>
                {isPost ? (
                  <div className="mt-1 grid gap-1 text-[12px] leading-[17px]">
                    <p><span className="font-semibold text-ink/70">Before: </span><span className="text-ink/80 line-through decoration-danger/50">{clip(d.before)}</span></p>
                    <p><span className="font-semibold text-ink/70">After: </span><span className="text-ink">{clip(d.after)}</span></p>
                  </div>
                ) : null}
                {isDenied ? <p className="mt-1 text-[12px] text-ink/75">{deniedLabel(d.route)} — {String(d.reason ?? "").replace(/_/g, " ")}</p> : null}
                {ver != null && vhash ? (
                  <p className="num mt-1 text-[11px] font-medium text-cobalt">Dossier v{ver} · {shortHash(vhash)}</p>
                ) : null}
                <p className="mt-0.5 text-[12px] font-medium text-ink/70">
                  {formatParisStamp(ev.createdAt, locale)} · {ev.actorName} · {ev.orgName}
                </p>
                <p className="num mt-2 break-all rounded-xl bg-paper-2 px-2 py-1.5 text-[10px] font-medium text-ink/70">
                  prev: {shortHash(ev.prevHash)} → hash: {ev.hash}
                </p>
              </div>
            </li>
              );
          })}
          {display.length === 0 ? <p className="text-[13px] text-ink/65">No events.</p> : null}
        </ol>
        <aside className="rounded-2xl border border-line bg-paper p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_20px_rgba(28,25,23,0.04)]">
          <h3 className="text-[13px] font-semibold text-ink">{t(locale, "shell.integrity")}</h3>
          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex justify-between gap-3 border-b border-line/70 py-1.5">
              <dt className="font-medium text-ink/65">Linked events</dt>
              <dd className="num font-semibold text-ink">{chain.length}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-line/70 py-1.5">
              <dt className="font-medium text-ink/65">Root / tip</dt>
              <dd className="num font-semibold text-ink">{shortHash(tipHash)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-line/70 py-1.5">
              <dt className="font-medium text-ink/65">Verification</dt>
              <dd className={`font-semibold ${intact ? "text-cobalt" : "text-clay"}`}>
                {intact ? t(locale, "shell.chainIntact") : t(locale, "shell.chainBroken")}
              </dd>
            </div>
            <div className="flex justify-between gap-3 py-1.5">
              <dt className="font-medium text-ink/65">Opening officers</dt>
              <dd className="text-right font-semibold text-ink">{officers}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] leading-[18px] text-ink/65">
            Each event carries the previous hash. Any tampering breaks the chain — exportable as a proof PDF.
          </p>
        </aside>
      </div>
    </div>
  );
}

function deniedLabel(route: unknown): string {
  const r = String(route ?? "");
  if (r.includes("preuve.pdf")) return "Proof PDF";
  if (r.includes("bids.json")) return "Bids JSON export";
  if (r.includes("awardBid")) return "Award action";
  return "Sealed data";
}
