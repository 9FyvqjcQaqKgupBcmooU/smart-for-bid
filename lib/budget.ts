/** Budget stored as HTML comment in briefing — no schema change. */
export function extractBudget(briefing: string): number | null {
  const m = briefing.match(/<!--\s*bid-budget:(\d+(?:\.\d+)?)\s*-->/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function withBudgetComment(briefing: string, budget: number): string {
  const cleaned = briefing.replace(/<!--\s*bid-budget:[^>]*-->/gi, "").trim();
  return `<!--bid-budget:${Math.round(budget)}-->\n${cleaned}`;
}
