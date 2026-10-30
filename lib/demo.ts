/** Featured demo AO — furniture framework. */
export const FEATURED_RFQ_NUMBER = "AO-2026-0001";

/** Mots de passe des clés démo (Hugo / Inès). */
export const DEMO_KEY_A = "alpha-ouvre";
export const DEMO_KEY_B = "bravo-ouvre";

/** SQLite / BID_DEMO_DB = démo Helios, pas un tenant live. */
export function isDemo() {
  if (process.env.BID_DEMO_DB === "1" || process.env.PLI_DEMO === "1") return true;
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("file:") || url.includes("file:");
}
