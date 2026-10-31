export const DEMO_NON_NEGOTIABLES = [
  "Facture envoyée exclusivement au format PDF",
  "Numéro de bon de commande obligatoire sur chaque facture",
  "Délai de paiement : 45 jours",
  "Acceptation préalable de la charte de compliance et anticorruption",
  "Attestation d'assurance RC pro en cours de validité",
  "Respect des normes sociales et environnementales Decathlon",
  "Livraison conforme aux entrepôts et créneaux indiqués au brief",
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
