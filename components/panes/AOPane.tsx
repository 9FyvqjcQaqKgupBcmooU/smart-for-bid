import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Money } from "@/components/Money";
import { formatDateTime, firstName } from "@/lib/format";
import { renderBriefing } from "@/lib/markdown";
import { OpeningCeremony } from "@/components/OpeningCeremony";
import { awardBid, inviteVendor, publishTender, submitBid, updateBriefing } from "@/app/actions/tenders";
import { Decision, btnPrimary, UpNext } from "@/components/chrome";
import { Explain } from "@/components/Explain";
import { Tabs } from "@/components/Tabs";
import { getLocale } from "@/lib/i18n/server";
import { t as i18n } from "@/lib/i18n";
import { isDemo } from "@/lib/demo";

export async function AOPane({ id, tab }: { id: string; tab?: string }) {
  const locale = await getLocale();
  const { current } = await requireUser();
  const t = await prisma.tender.findUnique({
    where: { id },
    include: {
      createdBy: true,
      keyAUser: true,
      keyBUser: true,
      invites: { include: { vendor: true } },
      versions: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
      bids: { include: { vendor: true }, orderBy: { submittedAt: "asc" } },
      openings: { include: { officer: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!t) notFound();
  const versions = t.versions;

  const revealed = t.status === "opened" || t.status === "awarded";
  const myBid = current.vendorId ? t.bids.find((b) => b.vendorId === current.vendorId) : null;
  const invited = current.vendorId ? t.invites.some((i) => i.vendorId === current.vendorId) : false;
  const vendors = await prisma.vendor.findMany();
  const uninvited = vendors.filter((v) => !t.invites.some((i) => i.vendorId === v.id));
  const showOpening = current.role !== "VENDOR" && (t.status === "published" || t.status === "closed" || t.status === "opened");
  const canDeposit = invited && current.role === "VENDOR" && t.status === "published" && new Date() < t.deadline;
  const awarded = t.awardedBidId ? t.bids.find((b) => b.id === t.awardedBidId) : null;
  let awardedPrice: number | null = null;
  if (awarded) {
    try {
      awardedPrice = (JSON.parse(awarded.payload) as { price: number }).price;
    } catch {
      awardedPrice = null;
    }
  }

  const labels = [
    i18n(locale, "ao.briefing"),
    revealed ? i18n(locale, "ao.offers") : i18n(locale, "ao.opening"),
    i18n(locale, "ao.log"),
  ];

  const parsedBids = revealed
    ? t.bids.map((b) => {
        let payload: { price: number; leadTimeDays: number; comments: string } = {} as {
          price: number;
          leadTimeDays: number;
          comments: string;
        };
        try {
          payload = JSON.parse(b.payload) as { price: number; leadTimeDays: number; comments: string };
        } catch {
          payload = {} as { price: number; leadTimeDays: number; comments: string };
        }
        return { b, payload };
      })
    : [];
  const cheapest = parsedBids.slice().sort((a, c) => a.payload.price - c.payload.price)[0];

  let question = t.title;
  if (t.status === "opened" && current.role === "BUYER") question = i18n(locale, "inbox.qAward");
  else if (t.status === "draft") question = i18n(locale, "ao.newFrom", { from: "" });
  else if (canDeposit) question = i18n(locale, "inbox.qDeposit");
  else question = i18n(locale, "inbox.qReadBrief");

  const requestedTab = tab === "opening" || tab === "offers" ? 1 : tab === "log" ? 2 : tab === "brief" || tab === "briefing" ? 0 : null;
  const initialTab = requestedTab ?? 0;

  function AddendaList() {
    return (
      <ol className="mt-1 space-y-1">
        {versions.map((v) => (
          <li key={v.id}>
            <span className="font-medium">{v.changedBy.name}</span> · {v.summary}
            <span className="block text-[13px] text-ink-soft">{formatDateTime(v.createdAt, locale)}</span>
          </li>
        ))}
      </ol>
    );
  }

  let upNext: ReactNode = null;
  if (showOpening && !revealed) {
    const iCan =
      (current.id === t.keyAUser.id && !t.keyAUnlocked) || (current.id === t.keyBUser.id && !t.keyBUnlocked);
    const other = current.id === t.keyAUser.id ? t.keyBUser : current.id === t.keyBUser.id ? t.keyAUser : null;
    const otherUnlocked =
      current.id === t.keyAUser.id ? t.keyBUnlocked : current.id === t.keyBUser.id ? t.keyAUnlocked : false;
    if (iCan && other) {
      upNext = (
        <UpNext
          locale={locale}
          label={
            otherUnlocked
              ? i18n(locale, "next.award")
              : i18n(locale, "next.unlocks", { name: firstName(other.name) })
          }
        />
      );
    } else if (!t.keyAUnlocked) {
      upNext = <UpNext locale={locale} label={i18n(locale, "next.unlocks", { name: firstName(t.keyAUser.name) })} />;
    } else if (!t.keyBUnlocked) {
      upNext = <UpNext locale={locale} label={i18n(locale, "next.unlocks", { name: firstName(t.keyBUser.name) })} />;
    }
  } else if (t.status === "opened") {
    upNext = <UpNext locale={locale} label={i18n(locale, "next.award")} />;
  }

  const extra = (
    <>
      {t.status === "draft" && (current.role === "BUYER" || current.id === t.createdById) && (
        <form id="publish-form" action={publishTender} className="space-y-2">
          <input type="hidden" name="id" value={t.id} />
          <p className="text-[15px] leading-[22px] text-ink-soft">
            {i18n(locale, "ao.sealOfficers", { a: t.keyAUser.name, b: t.keyBUser.name })}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input name="passA" type="password" required placeholder={i18n(locale, "ao.passA")} className="min-h-11 rounded-full border border-line bg-paper px-4 text-[16px]" />
            <input name="passB" type="password" required placeholder={i18n(locale, "ao.passB")} className="min-h-11 rounded-full border border-line bg-paper px-4 text-[16px]" />
          </div>
        </form>
      )}
    </>
  );

  const actions = (
    <>
      {t.status === "draft" && (current.role === "BUYER" || current.id === t.createdById) && (
        <button form="publish-form" className={btnPrimary()}>
          {i18n(locale, "actions.publishRFQ")}
        </button>
      )}
      {t.status === "opened" && current.role === "BUYER" && cheapest && (
        <form action={awardBid}>
          <input type="hidden" name="tenderId" value={t.id} />
          <input type="hidden" name="bidId" value={cheapest.b.id} />
          <button className={btnPrimary()}>{i18n(locale, "ao.awardTo", { vendor: cheapest.b.vendor.name })}</button>
        </form>
      )}
    </>
  );

  const depositForm = canDeposit ? (
    <form action={submitBid} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="tenderId" value={t.id} />
      <label>
        <Explain tip={i18n(locale, locale === "fr" ? "learn.ht" : "learn.exclTax")}>{i18n(locale, "ao.priceNet")}</Explain>
        <input name="price" required className="mt-1 min-h-11 w-full rounded-full border border-line bg-paper px-4 text-[16px]" />
      </label>
      <label>
        {i18n(locale, "ao.leadDays")}
        <input name="leadTimeDays" required type="number" className="mt-1 min-h-11 w-full rounded-full border border-line bg-paper px-4 text-[16px]" />
      </label>
      <textarea name="comments" rows={2} placeholder={i18n(locale, "ao.capacity")} className="col-span-2 rounded-2xl border border-line bg-paper px-4 py-2" />
      <button className={btnPrimary("col-span-2")}>{myBid ? i18n(locale, "actions.replaceBid") : i18n(locale, "actions.submitBid")}</button>
    </form>
  ) : current.role === "VENDOR" && invited ? (
    <p className="mt-4 text-[13px] leading-[18px] text-ink-soft">
      {myBid
        ? i18n(locale, "ao.yourPliSealed", { date: formatDateTime(myBid.submittedAt, locale) })
        : i18n(locale, "ao.deadlinePassed")}
    </p>
  ) : null;

  return (
    <Decision
      locale={locale}
      question={question}
      title={t.title}
      subtitle={`${t.number} · ${i18n(locale, "ao.deadline", { date: formatDateTime(t.deadline, locale) })}`}
      people={[
        { name: t.keyAUser.name, hint: i18n(locale, "roles.full.OPENING_A"), active: current.id === t.keyAUser.id && !t.keyAUnlocked },
        { name: t.keyBUser.name, hint: i18n(locale, "roles.full.OPENING_B"), active: current.id === t.keyBUser.id && !t.keyBUnlocked },
      ]}
      amount={awardedPrice}
      amountCaption={
        awardedPrice != null ? (
          <Explain tip={i18n(locale, locale === "fr" ? "learn.ht" : "learn.exclTax")}>
            {i18n(locale, "caption.awardedBeforeTax")}
          </Explain>
        ) : undefined
      }
      extra={t.status === "draft" && (current.role === "BUYER" || current.id === t.createdById) ? extra : false}
      actions={
        (t.status === "draft" && (current.role === "BUYER" || current.id === t.createdById)) ||
        (t.status === "opened" && current.role === "BUYER" && cheapest)
          ? actions
          : undefined
      }
      upNext={showOpening && !revealed ? upNext : t.status === "opened" && current.role === "BUYER" ? upNext : null}
      rail={false}
    >
      <Tabs labels={labels} initial={initialTab}>
        <div>
          <div
            className="space-y-1 break-words text-[16px] leading-6 [&_h2]:text-[16px] [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-4"
            dangerouslySetInnerHTML={{ __html: renderBriefing(t.briefing) }}
          />
          {depositForm}
          {versions.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-[13px] text-ink-soft">{i18n(locale, "ao.whoWhatWhen")}</p>
              <AddendaList />
            </div>
          )}
          {(current.role === "BUYER" || current.id === t.createdById) && t.status !== "awarded" && (
            <details className="mt-3 border-t border-line pt-3">
              <summary className="cursor-pointer text-[13px] text-ink-soft hover:text-ink">{i18n(locale, "ao.updateBrief")}</summary>
              <form action={updateBriefing} className="mt-2">
                <input type="hidden" name="id" value={t.id} />
                <textarea name="briefing" rows={4} defaultValue={t.briefing} className="w-full rounded-2xl border border-line bg-paper px-3 py-2 font-mono text-[13px]" />
                <input name="summary" placeholder={i18n(locale, "ao.changeNote")} className="mt-2 min-h-11 w-full rounded-full border border-line bg-paper px-4 text-[16px]" />
                <button className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-paper px-5 text-[16px] font-medium text-ink hover:bg-paper-2">{i18n(locale, "actions.save")}</button>
              </form>
            </details>
          )}
        </div>
        <div>
          {!revealed ? (
            <ul className="space-y-2">
              {t.bids.length === 0 && <p className="text-ink-soft">{i18n(locale, "ao.noBids")}</p>}
              {t.bids.map((b) => (
                <li key={b.id} className="soft-card flex justify-between px-3.5 py-3">
                  <span>{current.role === "VENDOR" && b.vendorId !== current.vendorId ? i18n(locale, "ao.bidder") : b.vendor.name}</span>
                  <span className="text-ink-soft">{i18n(locale, "ao.sealed", { date: formatDateTime(b.submittedAt, locale) })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-0 text-[16px]">
              <thead className="text-left text-[13px] text-ink-soft">
                <tr>
                  <th className="py-1">{i18n(locale, "ao.vendor")}</th>
                  <th>{i18n(locale, "ao.priceHT")}</th>
                  <th>{i18n(locale, "ao.lead")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {parsedBids.map(({ b, payload }) => {
                  const isAwarded = t.awardedBidId === b.id;
                  return (
                    <tr key={b.id} className="border-t border-line">
                      <td className="py-1.5 font-medium">
                        {b.vendor.name}
                        {isAwarded && <span className="ml-1 text-[13px] text-success">{i18n(locale, "ao.awarded")}</span>}
                      </td>
                      <td className="tabular">
                        <Money value={payload.price} locale={locale} />
                      </td>
                      <td>{payload.leadTimeDays} d</td>
                      <td className="text-right">
                        {t.status === "opened" && current.role === "BUYER" && cheapest?.b.id !== b.id && (
                          <form action={awardBid}>
                            <input type="hidden" name="tenderId" value={t.id} />
                            <input type="hidden" name="bidId" value={b.id} />
                            <button className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[14px] font-medium text-ink hover:bg-paper-2">{i18n(locale, "actions.award")}</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
          {showOpening && !revealed && (
            <div className="mt-4">
              <OpeningCeremony
                tenderId={t.id}
                itemKey={`ao:${t.id}`}
                deadline={t.deadline.toISOString()}
                keyAUnlocked={t.keyAUnlocked}
                keyBUnlocked={t.keyBUnlocked}
                officerA={{ id: t.keyAUser.id, name: t.keyAUser.name }}
                officerB={{ id: t.keyBUser.id, name: t.keyBUser.name }}
                currentUserId={current.id}
                currentName={current.name}
                locale={locale}
                demo={isDemo()}
              />
            </div>
          )}
        </div>
        <div>
          <p className="text-[13px] text-ink-soft">{i18n(locale, "ao.whoWhatWhen")}</p>
          <AddendaList />
          {t.openings.length > 0 && (
            <ol className="mt-2 space-y-1">
              {t.openings.map((o) => (
                <li key={o.id}>
                  <span className="font-medium">{o.officer.name}</span>
                  {" · "}
                  {o.success ? i18n(locale, "ao.keyOk") : i18n(locale, "ao.keyFail")}
                  <span className="block text-[13px] text-ink-soft">{formatDateTime(o.createdAt, locale)}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-[13px] text-ink-soft">{i18n(locale, "ao.invitees")}</p>
          <ul className="mt-1 space-y-0.5">
            {t.invites.map((i) => (
              <li key={i.id}>{i.vendor.name}</li>
            ))}
          </ul>
          {uninvited.length > 0 && current.role === "BUYER" && t.status !== "awarded" && (
            <form action={inviteVendor} className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
              <input type="hidden" name="tenderId" value={t.id} />
              <select name="vendorId" className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[16px]">
                {uninvited.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-paper px-5 text-[16px] font-medium text-ink hover:bg-paper-2">{i18n(locale, "actions.invite")}</button>
            </form>
          )}
        </div>
      </Tabs>
    </Decision>
  );
}
