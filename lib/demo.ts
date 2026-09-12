/** Featured demo RFQ — Store furniture framework agreement 2026-2028. */
export const FEATURED_RFQ_NUMBER = "AO-2026-0001";

/** Dual-key passwords seeded on AO-2026-0001 (Hugo / Inès). */
export const DEMO_KEY_A = "alpha-ouvre";
export const DEMO_KEY_B = "bravo-ouvre";

/** SQLite (or PLI_DEMO=1) means this is the Helios click-through, not a live tenant. */
export function isDemo() {
  if (process.env.PLI_DEMO === "1") return true;
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("file:") || url.includes("file:");
}
