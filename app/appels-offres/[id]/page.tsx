import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { formatParisStamp, formatEUR, firstName } from "@/lib/format";
import { extractBudget } from "@/lib/budget";
import { buildAuditChain, sealFingerprint, verifyAuditChain, type ChainableEvent } from "@/lib/audit-chain";
import { StatusPill } from "@/components/StatusPill";
import { SealMark, sealStateOf } from "@/components/SealMark";
import { AuditJournal } from "@/components/AuditJournal";
import { OpeningHero } from "@/components/OpeningHero";
import { OpeningCeremony } from "@/components/OpeningCeremony";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { renderBriefing } from "@/lib/markdown";
import { awardBid, inviteVendor, publishTender, submitBid, updateBriefing, validateTender, returnTender } from "@/app/actions/tenders";
import { btnPrimary } from "@/components/chrome";
import { isDemo } from "@/lib/demo";
import { Money } from "@/components/Money";
import { BriefEditor } from "@/components/BriefEditor";
import { ConditionsEditor } from "@/components/ConditionsEditor";
import { ConditionsAccept } from "@/components/ConditionsAccept";
import { parseConditions } from "@/lib/conditions";

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
  const { current } = await requireUser();
  const tender = await prisma.tender.findUnique({
    where: { id },
    include: {
      createdBy: { include: { company: true } },
      keyAUser: true,
      keyBUser: true,
      invites: { include: { vendor: true } },
      versions: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
      bids: { include: { vendor: true }, orderBy: { submittedAt: "asc" } },
      openings: { include: { officer: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!tender) notFound();

  const now = Date.now();
  const pastDeadline = now >= tender.deadline.getTime();
  const status = tender.status === "published" && pastDeadline ? "closed" : tender.status;
  const revealed = tender.status === "opened" || tender.status === "awarded";
  const seal = sealStateOf(tender);
  const budget = extractBudget(tender.briefing);
  const myBid = current.vendorId ? tender.bids.find((b) => b.vendorId === current.vendorId) : null;
  const conditions = parseConditions(tender.nonNegotiables);
  const invited = current.vendorId ? tender.invites.some((i) => i.vendorId === current.vendorId) : false;
  const canDeposit = invited && current.role === "VENDOR" && tender.status === "published" && !pastDeadline;
  const showOpening =
    current.role !== "VENDOR" && (tender.status === "published" || tender.status === "closed" || status === "closed" || tender.status === "opened");

  const events = await prisma.auditEvent.findMany({
    where: { entityType: "Tender", entityId: id },
    include: { actor: { include: { company: true, vendor: true } } },
    orderBy: { createdAt: "asc" },
  });
  const chainable: ChainableEvent[] = events.map((e) => ({
    id: e.id,
    entityType: e.entityType,
    entityId: e.entityId,
    action: e.action,
    actorId: e.actorId,
    actorName: e.actor.name,
    orgName: e.actor.vendor?.name ?? e.actor.company?.name ?? "Decathlon",
    details: e.details ?? "",
    createdAt: e.createdAt,
  }));
  const chain = buildAuditChain(chainable);
  const verify = verifyAuditChain(chain);
  const sealFp = sealFingerprint(tender.bids);

  const unlockA = tender.openings.find((o) => o.lock === "A" && o.success);
  const unlockB = tender.openings.find((o) => o.lock === "B" && o.success);

  const parsed = revealed
    ? tender.bids
        .map((b) => {
          try {
            return { vendor: b.vendor.name, price: (JSON.parse(b.payload) as { price: number }).price, id: b.id };
          } catch {
            return { vendor: b.vendor.name, price: 0, id: b.id };
          }
        })
        .sort((a, b) => a.price - b.price)
    : [];

  const tabKey = (tab ?? (revealed ? "cles" : "brief")).toLowerCase();
  const active =
    tabKey === "offres" || tabKey === "offers"
      ? "offres"
      : tabKey === "cles" || tabKey === "keys" || tabKey === "opening"
        ? "cles"
        : tabKey === "historique" || tabKey === "journal" || tabKey === "log" || tabKey === "history"
          ? "journal"
          : "brief";

  const tabs = [
    { id: "brief", label: t(locale, "shell.brief"), href: `?tab=brief` },
    { id: "offres", label: t(locale, "shell.offers"), href: `?tab=offres`, count: tender.bids.length },
    { id: "cles", label: t(locale, "shell.keys"), href: `?tab=cles` },
    { id: "journal", label: t(locale, "shell.history"), href: `?tab=historique` },
  ];

  const vendors = await prisma.vendor.findMany();
  const uninvited = vendors.filter((v) => !tender.invites.some((i) => i.vendorId === v.id));

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="shrink-0 border-b border-line px-4 py-2.5 md:px-6">
        <Breadcrumbs
          locale={locale}
          items={[
            { label: t(locale, "shell.backToList"), href: "/" },
            { label: tender.number },
          ]}
        />
      </div>

      <div className="shrink-0 border-b border-line px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="num text-[13px] font-semibold text-cobalt">{tender.number}</span>
              <StatusPill status={status} locale={locale} />
              <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-soft px-2 py-0.5 text-[11px] font-semibold text-cobalt">
                <SealMark state={seal} size={12} />
                {seal === "opened" ? "Ouvert" : seal === "one" ? "1/2 clé" : "Pli scellé"}
              </span>
            </div>
            <h1 className="mt-1 text-[18px] font-semibold tracking-tight text-ink">{tender.title}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-medium text-ink/70">
              <span>
                Échéance <strong className="num text-ink">{formatParisStamp(tender.deadline, locale)}</strong>
              </span>
              {budget != null ? (
                <span>
                  Budget <strong className="num text-ink">{formatEUR(budget, locale)}</strong>
                </span>
              ) : null}
              <span>
                Offres <strong className="num text-ink">{tender.bids.length}/{tender.invites.length}</strong>
              </span>
              <span>
                Acheteuse <strong className="text-ink">{tender.createdBy.name}</strong>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tender.status === "draft" && (current.role === "BUYER" || current.id === tender.createdById) ? (
              <form action={publishTender} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={tender.id} />
                <input name="passA" type="password" required placeholder="Mot de passe clé A" className="min-h-10 rounded-full border border-line px-3 text-[14px]" />
                <input name="passB" type="password" required placeholder="Mot de passe clé B" className="min-h-10 rounded-full border border-line px-3 text-[14px]" />
                <button className={btnPrimary() + " min-h-10"}>Soumettre à validation</button>
              </form>
            ) : null}
            {tender.status === "pending_validation" && current.role === "VALIDATOR" ? (
              <div className="flex flex-wrap items-end gap-2">
                <form action={validateTender}>
                  <input type="hidden" name="id" value={tender.id} />
                  <button className={btnPrimary() + " min-h-10"}>Valider et publier</button>
                </form>
                <form action={returnTender} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={tender.id} />
                  <input name="comment" required placeholder="Commentaire de renvoi" className="min-h-10 rounded-full border border-line px-3 text-[14px]" />
                  <button className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 text-[13px] font-semibold">Renvoyer</button>
                </form>
              </div>
            ) : null}
            {tender.status === "pending_validation" && current.role !== "VALIDATOR" ? (
              <p className="max-w-xs text-[13px] text-ink/70">En attente de validation N+1 avant publication fournisseurs.</p>
            ) : null}
            {tender.validationNote && tender.status === "draft" ? (
              <p className="max-w-sm rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] text-danger">
                Renvoyé : {tender.validationNote}
              </p>
            ) : null}
            {showOpening && !revealed && pastDeadline ? (
              <Link href="?tab=cles" className="inline-flex min-h-9 items-center rounded-full bg-cobalt px-3.5 text-[13px] font-semibold text-paper">
                Ouvrir les plis
              </Link>
            ) : null}
            {tender.status === "opened" && current.role === "BUYER" && parsed[0] ? (
              <form action={awardBid}>
                <input type="hidden" name="tenderId" value={tender.id} />
                <input type="hidden" name="bidId" value={parsed[0].id} />
                <button className={btnPrimary()}>Attribuer à {parsed[0].vendor}</button>
              </form>
            ) : null}
            <Link href={`/appels-offres/${tender.id}/preuve.pdf`} className="inline-flex min-h-9 items-center rounded-full border border-line px-3.5 text-[13px] font-semibold text-ink">
              {t(locale, "shell.exportProof")}
            </Link>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-0 overflow-x-auto border-b border-line px-2 md:px-4">
        {tabs.map((tb) => (
          <Link
            key={tb.id}
            href={tb.href}
            className={`relative px-3 py-2.5 text-[13px] font-semibold ${active === tb.id ? "text-cobalt" : "text-ink/65 hover:text-ink"}`}
          >
            {tb.label}
            {"count" in tb && tb.count != null ? <span className="num ml-1 text-[11px]">{tb.count}</span> : null}
            {active === tb.id ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-cobalt" /> : null}
          </Link>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 md:px-6">
        {active === "brief" ? (
          <div className="max-w-3xl space-y-4">
            {conditions.length > 0 ? (
              <div className="rounded-xl border-2 border-cobalt/30 bg-cobalt-soft/30 p-4" data-testid="non-negotiables">
                <h2 className="text-[15px] font-semibold text-ink">Conditions non négociables</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-5 text-ink">
                  {conditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="brief text-[14px] leading-5" dangerouslySetInnerHTML={{ __html: renderBriefing(tender.briefing) }} />
            {myBid ? (
              <div className="rounded-xl border border-line bg-cobalt-soft/50 p-4" data-testid="offer-receipt">
                <p className="text-[13px] font-semibold text-cobalt">
                  Offre reçue le {formatParisStamp(myBid.submittedAt, locale)}
                </p>
                <p className="mt-1 text-[14px] text-ink">Votre pli est scellé en sécurité.</p>
                {myBid.acceptedConditions ? (
                  <p className="mt-2 text-[13px] text-ink/70">Conditions non négociables acceptées (horodatées Paris).</p>
                ) : null}
              </div>
            ) : null}
            {canDeposit ? (
              <form action={submitBid} className="grid grid-cols-1 gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
                <input type="hidden" name="tenderId" value={tender.id} />
                <div className="col-span-full">
                  <ConditionsAccept items={conditions} />
                </div>
                <label className="text-[14px] font-medium text-ink">
                  Prix HT (€)
                  <input name="price" required className="mt-1 min-h-11 w-full rounded-full border border-line px-4 text-[16px]" />
                </label>
                <label className="text-[14px] font-medium text-ink">
                  Délai (jours)
                  <input name="leadTimeDays" required type="number" className="mt-1 min-h-11 w-full rounded-full border border-line px-4 text-[16px]" />
                </label>
                <textarea name="comments" rows={2} placeholder="Commentaires" className="col-span-full min-h-10 rounded-2xl border border-line px-4 py-2 text-[14px]" />
                <button className={btnPrimary("col-span-full min-h-11")}>{myBid ? "Remplacer l'offre" : "Envoyer l'offre"}</button>
              </form>
            ) : null}
            {(current.role === "BUYER" || current.id === tender.createdById) && tender.status !== "awarded" && tender.status !== "opened" ? (
              <details className="rounded-xl border border-line p-4">
                <summary className="cursor-pointer text-[14px] font-semibold text-cobalt">Modifier le brief et les conditions</summary>
                <form action={updateBriefing} className="mt-3 space-y-3">
                  <input type="hidden" name="id" value={tender.id} />
                  <BriefEditor name="briefing" defaultValue={tender.briefing} rows={8} />
                  <div>
                    <p className="mb-1 text-[14px] font-medium">Conditions non négociables</p>
                    <ConditionsEditor name="nonNegotiables" defaultItems={conditions} />
                  </div>
                  <input name="summary" placeholder="Note de changement" className="min-h-11 w-full rounded-full border border-line px-4 text-[16px]" />
                  <button className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-[14px] font-semibold">Enregistrer</button>
                </form>
              </details>
            ) : null}
          </div>
        ) : null}

        {active === "offres" ? (
          <div className="max-w-3xl space-y-3">
            {!revealed ? (
              <div className="flex items-center gap-3 rounded-xl border border-line p-4">
                <SealMark state={seal} size={32} />
                <div>
                  <p className="text-[15px] font-semibold text-ink">
                    {seal === "one" ? "Une clé posée" : "Plis scellés"}
                    <span className="num ml-2 text-[13px] font-medium text-ink/60">
                      {Number(tender.keyAUnlocked) + Number(tender.keyBUnlocked)}/2
                    </span>
                  </p>
                  <p className="text-[13px] text-ink/65">
                    {tender.bids.length} offre(s) reçue(s) — montants masqués jusqu&apos;à l&apos;ouverture à deux clés.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-[0.06em] text-ink/60">
                    <th className="py-2 font-semibold">Fournisseur</th>
                    <th className="py-2 font-semibold">Prix HT</th>
                    <th className="py-2 font-semibold">Reçu</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((p) => (
                    <tr key={p.id} className="border-b border-line/70">
                      <td className="py-2.5 font-semibold text-ink">{p.vendor}</td>
                      <td className="num py-2.5"><Money value={p.price} locale={locale} /></td>
                      <td className="num py-2.5 text-ink/65">
                        {formatParisStamp(tender.bids.find((b) => b.id === p.id)!.submittedAt, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
            <ul className="text-[14px] text-ink/70">
              {tender.invites.map((i) => (
                <li key={i.id}>
                  {i.vendor.name}
                  {tender.bids.some((b) => b.vendorId === i.vendorId) ? " · offre déposée" : " · en attente"}
                </li>
              ))}
            </ul>
            {uninvited.length > 0 && current.role === "BUYER" && tender.status !== "awarded" ? (
              <form action={inviteVendor} className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="tenderId" value={tender.id} />
                <select name="vendorId" className="min-h-11 flex-1 rounded-full border border-line px-4 text-[16px]">
                  {uninvited.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5 text-[14px] font-semibold">Inviter</button>
              </form>
            ) : null}
          </div>
        ) : null}

        {active === "cles" ? (
          <div className="max-w-4xl space-y-4">
            {revealed ? (
              <OpeningHero
                locale={locale}
                tenderId={tender.id}
                number={tender.number}
                title={tender.title}
                openedAt={tender.openedAt ?? new Date()}
                budget={budget}
                officerA={{ name: tender.keyAUser.name, title: tender.keyAUser.title }}
                officerB={{ name: tender.keyBUser.name, title: tender.keyBUser.title }}
                unlockAAt={unlockA?.createdAt ?? null}
                unlockBAt={unlockB?.createdAt ?? null}
                sealBefore={sealFp}
                sealAfter={sealFp}
                offers={parsed.map((p) => ({ vendor: p.vendor, price: p.price }))}
                proofRef={`PRF-${tender.number.replace("AO-", "")}-${(tender.openedAt ?? new Date()).toISOString().slice(11, 16).replace(":", "")}`}
              />
            ) : (
              <>
                <div className="rounded-xl border border-line p-4">
                  <h2 className="text-[15px] font-semibold text-ink">{t(locale, "shell.openingTitle")}</h2>
                  <p className="mt-1 text-[13px] text-ink/65">
                    Deux officiers distincts doivent poser leur clé après l&apos;échéance. Acheteuse : pas d&apos;accès aux montants avant ouverture.
                  </p>
                  <p className="num mt-3 break-all rounded-lg bg-paper-2 px-3 py-2 text-[11px] text-ink/70">
                    {t(locale, "shell.sealFp")} : {sealFp}
                  </p>
                </div>
                {showOpening && pastDeadline ? (
                  <OpeningCeremony
                    tenderId={tender.id}
                    itemKey={`ao:${tender.id}`}
                    deadline={tender.deadline.toISOString()}
                    keyAUnlocked={tender.keyAUnlocked}
                    keyBUnlocked={tender.keyBUnlocked}
                    officerA={{ id: tender.keyAUser.id, name: tender.keyAUser.name }}
                    officerB={{ id: tender.keyBUser.id, name: tender.keyBUser.name }}
                    currentUserId={current.id}
                    currentName={current.name}
                    locale={locale}
                    demo={isDemo()}
                    compact={false}
                  />
                ) : (
                  <p className="text-[13px] text-ink/65">
                    {pastDeadline
                      ? `En attente de ${firstName(tender.keyAUnlocked ? tender.keyBUser.name : tender.keyAUser.name)}.`
                      : "L'ouverture sera possible après l'échéance."}
                  </p>
                )}
              </>
            )}
          </div>
        ) : null}

        {active === "journal" ? (
          <AuditJournal
            locale={locale}
            chain={chain}
            intact={verify.ok}
            tipHash={verify.tipHash}
            brokenAt={verify.brokenAt}
            tenderId={tender.id}
            officers={`${tender.keyAUser.name} · ${tender.keyBUser.name}`}
          />
        ) : null}
      </div>
    </div>
  );
}
