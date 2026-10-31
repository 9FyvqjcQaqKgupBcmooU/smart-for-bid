const LABELS: Record<string, string> = {
  create: "Brouillon créé",
  publish: "AO publié — invitations envoyées",
  invite: "Fournisseur invité",
  briefing_edit: "Briefing mis à jour (addendum)",
  bid_submit: "Offre déposée",
  unlock_ok: "Clé acceptée",
  unlock_fail: "Tentative de clé refusée",
  key_unlock_A: "Clé A acceptée",
  key_unlock_B: "Clé B acceptée",
  open: "Pli ouvert — offres révélées",
  opened: "Pli ouvert — offres révélées",
  award: "Attribution enregistrée",
  deadline_passed: "Échéance atteinte — plis scellés",
  validation_request: "Soumis à validation N+1",
  validation_ok: "Validation N+1 — publication autorisée",
  validation_return: "Renvoyé par le valideur N+1",
  conditions_accepted: "Conditions non négociables acceptées",
  org_conditions_edit: "Conditions organisation mises à jour",
};

export function auditActionLabel(action: string): string {
  return LABELS[action] ?? action;
}
