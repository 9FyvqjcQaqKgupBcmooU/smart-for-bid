export const S2P_STEPS = [
  { n: 1, href: "/appels-offres", labelKey: "steps.source", hintKey: "steps.sourceHint", countKey: "ao" as const },
  { n: 2, href: "/demandes", labelKey: "steps.request", hintKey: "steps.requestHint", countKey: "da" as const },
  { n: 3, href: "/commandes", labelKey: "steps.order", hintKey: "steps.orderHint", countKey: "po" as const },
  { n: 4, href: "/receptions", labelKey: "steps.receive", hintKey: "steps.receiveHint", countKey: "gr" as const },
  { n: 5, href: "/factures", labelKey: "steps.invoice", hintKey: "steps.invoiceHint", countKey: "fa" as const },
  { n: 6, href: "/paiements", labelKey: "steps.pay", hintKey: "steps.payHint", countKey: "pay" as const },
];

/** P2P document cycle (Wikipedia / SAP). Sourcing is S2P, not a node here. */
export const PIPELINE_STEPS = [
  { n: 1, href: "/demandes", labelKey: "steps.requisition" },
  { n: 2, href: "/commandes", labelKey: "steps.po" },
  { n: 3, href: "/receptions", labelKey: "steps.receiving" },
  { n: 4, href: "/factures", labelKey: "steps.invoice" },
  { n: 5, href: "/paiements", labelKey: "steps.payment" },
] as const;

export const PIPELINE_INDEX = {
  da: 0,
  po: 1,
  gr: 2,
  fa: 3,
  pay: 4,
} as const;

export type StepCounts = {
  ao: number;
  da: number;
  po: number;
  gr: number;
  fa: number;
  pay: number;
};

/** Active pipeline node (0–4), or null on home / sourcing / anything outside P2P. */
export function pipelineIndexFromPath(path: string): number | null {
  if (!path || path === "/") return null;
  const hit = PIPELINE_STEPS.findIndex((s) => path === s.href || path.startsWith(`${s.href}/`));
  return hit === -1 ? null : hit;
}

export function listHref(path: string, id?: string | null) {
  if (!id) return path;
  return `${path}?id=${id}`;
}
