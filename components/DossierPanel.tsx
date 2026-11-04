import { formatParisStamp } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { askQuestion, answerQuestion, acknowledgeDossier } from "@/app/actions/tenders";
import { btnPrimary } from "@/components/chrome";

type QA = { id: string; question: string; answer: string | null; askedAt: Date; answeredAt: Date | null; answeredByName?: string | null };

export function DossierPanel({
  locale,
  tenderId,
  version,
  hash,
  deadline,
  updatedAt,
  qa,
  role,
  canAsk,
  needsReack,
  bidVersion,
  ackedAt,
}: {
  locale: Locale;
  tenderId: string;
  version: number;
  hash: string;
  deadline: Date;
  updatedAt: Date | null;
  qa: QA[];
  role: string;
  canAsk: boolean;
  needsReack: boolean;
  bidVersion: number | null;
  ackedAt: Date | null;
}) {
  const answered = qa.filter((q) => q.answer && q.answeredAt).sort((a, b) => a.answeredAt!.getTime() - b.answeredAt!.getTime());
  const pending = qa.filter((q) => !q.answer);
  const isVendor = role === "VENDOR";
  return (
    <section className="space-y-3" data-testid="dossier-panel">
      <div className="rounded-xl border border-line bg-paper-2/60 px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="num inline-flex items-center rounded-full bg-cobalt px-2.5 py-0.5 text-[12px] font-semibold text-paper" data-testid="dossier-version">
            Dossier v{version}
          </span>
          <span className="text-[12px] font-medium text-ink/70">Identical for every invited supplier</span>
        </div>
        <p className="num mt-2 break-all text-[11px] font-medium text-ink/75" data-testid="dossier-hash">SHA-256 {hash}</p>
        <dl className="mt-2 grid gap-x-4 gap-y-1 text-[12px] text-ink/75 sm:grid-cols-2">
          <div><dt className="inline font-semibold text-ink/65">Deadline </dt><dd className="num inline text-ink">{formatParisStamp(deadline, locale)}</dd></div>
          {updatedAt ? (
            <div><dt className="inline font-semibold text-ink/65">Last change </dt><dd className="num inline text-ink">{formatParisStamp(updatedAt, locale)}</dd></div>
          ) : null}
          {isVendor && ackedAt ? (
            <div className="sm:col-span-2"><dt className="inline font-semibold text-ink/65">You acknowledged this version </dt><dd className="num inline text-ink">{formatParisStamp(ackedAt, locale)}</dd></div>
          ) : null}
        </dl>
      </div>

      {isVendor && needsReack ? (
        <form action={acknowledgeDossier} className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3" data-testid="reack-banner">
          <input type="hidden" name="tenderId" value={tenderId} />
          <p className="text-[13px] font-semibold text-danger">Conditions changed after your bid</p>
          <p className="mt-0.5 text-[12px] text-ink/80">
            Your bid was submitted against dossier v{bidVersion ?? 1}. The current version is v{version}. Review the changes in the audit log, then re-acknowledge.
          </p>
          <button className={btnPrimary("mt-2 min-h-10")}>Re-acknowledge dossier v{version}</button>
        </form>
      ) : null}

      <div className="rounded-xl border border-line px-3.5 py-3" data-testid="qa">
        <h2 className="text-[13px] font-semibold text-ink">Questions &amp; answers <span className="font-medium text-ink/60">· broadcast to all suppliers</span></h2>
        {answered.length === 0 ? <p className="mt-1 text-[12px] text-ink/65">No published answers yet.</p> : null}
        <ol className="mt-2 space-y-2.5">
          {answered.map((q, i) => (
            <li key={q.id} className="text-[13px] leading-5">
              <p className="text-ink"><span className="font-semibold">Q{i + 1}.</span> {q.question}</p>
              <p className="num text-[11px] text-ink/60">A supplier · {formatParisStamp(q.askedAt, locale)}</p>
              <p className="mt-1 border-l-2 border-cobalt pl-2 text-ink">{q.answer}</p>
              <p className="num pl-2.5 text-[11px] text-ink/60">{q.answeredByName ?? "Buyer"} · {formatParisStamp(q.answeredAt!, locale)}</p>
            </li>
          ))}
        </ol>
        {role === "BUYER" && pending.length > 0 ? (
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <p className="text-[12px] font-semibold text-ink/70">Awaiting your answer — it will be sent to every invited supplier</p>
            {pending.map((q) => (
              <form key={q.id} action={answerQuestion} className="space-y-1.5">
                <input type="hidden" name="questionId" value={q.id} />
                <p className="text-[13px] text-ink">{q.question} <span className="num text-[11px] text-ink/60">· A supplier · {formatParisStamp(q.askedAt, locale)}</span></p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input name="answer" required placeholder="Answer for all suppliers" className="min-h-10 flex-1 rounded-full border border-line px-3.5 text-[14px]" />
                  <button className={btnPrimary("min-h-10")}>Broadcast answer</button>
                </div>
              </form>
            ))}
          </div>
        ) : null}
        {isVendor && canAsk ? (
          <form action={askQuestion} className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row">
            <input type="hidden" name="tenderId" value={tenderId} />
            <input name="question" required minLength={5} placeholder="Ask a question (your name is never shown)" className="min-h-10 flex-1 rounded-full border border-line px-3.5 text-[14px]" />
            <button className="inline-flex min-h-10 items-center justify-center rounded-full border border-line px-4 text-[13px] font-semibold">Send question</button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
