/** Featured demo AO — furniture framework. */
export const FEATURED_RFQ_NUMBER = "AO-2026-0001";

/** Demo dual-key passwords (Hugo / Florent). Shown in README and e2e only — never in the UI. */
export const DEMO_KEY_A = "alpha-open";
export const DEMO_KEY_B = "bravo-open";

/** SQLite / BID_DEMO_DB = Decathlon demo, not a live tenant. */
export function isDemo() {
  if (process.env.BID_DEMO_DB === "1" || process.env.PLI_DEMO === "1") return true;
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("file:") || url.includes("file:");
}
