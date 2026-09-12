import { prisma } from "./prisma";
import { t as tx, type Locale } from "./i18n";
import { FEATURED_RFQ_NUMBER } from "./demo";

export type InboxKind = "da" | "ao" | "fa" | "pay" | "po";
export type InboxTone = "danger" | "warn" | "info" | "ok";

export type InboxItem = {
  key: string;
  kind: InboxKind;
  id: string;
  number: string;
  title: string;
  headline: string;
  support: string;
  question: string;
  cta: string;
  meta: string;
  amount?: number;
  extra?: number;
  tone: InboxTone;
  actionLabel: string;
  actionable: boolean;
  type?: string;
};

function item(partial: Omit<InboxItem, "title" | "headline" | "support" | "question" | "cta" | "meta" | "actionLabel" | "actionable"> & {
  headline: string;
  support: string;
  question: string;
  cta: string;
  actionable?: boolean;
}): InboxItem {
  return {
    ...partial,
    title: partial.headline,
    meta: partial.support,
    actionLabel: partial.cta,
    actionable: partial.actionable !== false,
  };
}

function featuredFirst(a: InboxItem, b: InboxItem) {
  const fa = a.number === FEATURED_RFQ_NUMBER ? 0 : 1;
  const fb = b.number === FEATURED_RFQ_NUMBER ? 0 : 1;
  return fa - fb;
}

export function pickInboxItem(items: InboxItem[], explicitKey?: string | null): InboxItem | undefined {
  if (explicitKey) {
    const hit = items.find((i) => i.key === explicitKey || i.id === explicitKey);
    if (hit) return hit;
  }
  return items.find((i) => i.number === FEATURED_RFQ_NUMBER) ?? items[0];
}

export async function getInbox(user: { id: string; role: string; vendorId: string | null }, locale: Locale = "en"): Promise<InboxItem[]> {
  const now = new Date();
  const items: InboxItem[] = [];
  const seen = new Set<string>();
  const push = (it: InboxItem) => {
    if (seen.has(it.key)) return;
    seen.add(it.key);
    items.push(it);
  };

  const tenders = await prisma.tender.findMany({
    include: { bids: true, invites: true },
    orderBy: { number: "asc" },
  });

  if (user.role !== "VENDOR") {
    for (const t of tenders) {
      const past = t.deadline <= now;
      const locked = !(t.keyAUnlocked && t.keyBUnlocked);

      if (t.status === "published" || t.status === "closed") {
        push(
          item({
            key: `ao:${t.id}`,
            kind: "ao",
            id: t.id,
            number: t.number,
            headline: t.title,
            support: tx(locale, "inbox.sealedSupport", { n: t.bids.length }),
            question: tx(locale, "inbox.qOpenBids"),
            cta: tx(locale, "actions.unlockBids"),
            tone: past && locked ? "info" : "ok",
            actionable: past && locked,
          })
        );
      }
      if (t.status === "opened") {
        push(
          item({
            key: `ao:${t.id}`,
            kind: "ao",
            id: t.id,
            number: t.number,
            headline: t.title,
            support: tx(locale, "inbox.toAward"),
            question: tx(locale, "inbox.qAward"),
            cta: tx(locale, "actions.awardBid"),
            tone: "warn",
            actionable: user.role === "BUYER",
          })
        );
      }
    }
  }

  if (user.role === "VENDOR" && user.vendorId) {
    for (const t of tenders) {
      if (!t.invites.some((i) => i.vendorId === user.vendorId)) continue;
      if (t.status === "published" && t.deadline > now) {
        push(
          item({
            key: `ao:${t.id}`,
            kind: "ao",
            id: t.id,
            number: t.number,
            headline: t.title,
            support: tx(locale, "inbox.biddingOpen"),
            question: t.title,
            cta: tx(locale, "inbox.submitBid"),
            tone: "info",
          })
        );
      }
      if (t.status === "published" || t.status === "closed" || t.status === "opened" || t.status === "awarded") {
        push(
          item({
            key: `ao:${t.id}`,
            kind: "ao",
            id: t.id,
            number: t.number,
            headline: t.title,
            support: tx(locale, "inbox.sealedSupport", { n: t.bids.length }),
            question: t.title,
            cta: tx(locale, "inbox.submitBid"),
            tone: "ok",
            actionable: false,
          })
        );
      }
    }
  }

  const rank: Record<InboxTone, number> = { danger: 0, warn: 1, info: 2, ok: 3 };
  items.sort(
    (a, b) =>
      featuredFirst(a, b) ||
      Number(b.actionable) - Number(a.actionable) ||
      rank[a.tone] - rank[b.tone] ||
      (b.amount ?? 0) - (a.amount ?? 0)
  );
  return items;
}
