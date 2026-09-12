export function suggestGLAccount(text: string): { code: string; reasonKey: string } | null {
  const t = text.toLowerCase();
  const rules: Array<{ keys: string[]; code: string; reasonKey: string }> = [
    { keys: ["loyer", "location", "bail", "rent", "lease"], code: "613", reasonKey: "extract.glRent" },
    { keys: ["marchandise", "article", "stock", "ballon", "ball", "rayonnage", "racking", "équipement sport", "sports", "textile"], code: "607", reasonKey: "extract.glGoods" },
    { keys: ["prestation", "sous-trait", "nettoyage", "cleaning", "conseil", "honoraires", "service", "subcontract"], code: "611", reasonKey: "extract.glService" },
    { keys: ["transport", "affrètement", "fret", "freight", "livraison", "delivery", "logistique", "logistics"], code: "624", reasonKey: "extract.glFreight" },
    { keys: ["informatique", " logiciel", "saas", "it ", "télécom", "telecom", "hébergement", "cloud"], code: "626", reasonKey: "extract.glIt" },
  ];
  for (const r of rules) {
    if (r.keys.some((k) => t.includes(k.trim()))) return { code: r.code, reasonKey: r.reasonKey };
  }
  return null;
}
