export const DEMO_NON_NEGOTIABLES = [
  "Invoice must be sent exclusively as PDF",
  "Purchase order number mandatory on every invoice",
  "Payment terms: 45 days",
  "Prior acceptance of the compliance and anti-corruption charter",
  "Valid professional liability insurance certificate",
  "Compliance with Decathlon social and environmental standards",
  "Delivery to the warehouses and time slots stated in the brief",
] as const;

export function parseConditions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String).filter((s) => s.trim()) : [];
  } catch {
    return [];
  }
}

export function serializeConditions(items: string[]): string {
  return JSON.stringify(items.map((s) => s.trim()).filter(Boolean));
}
