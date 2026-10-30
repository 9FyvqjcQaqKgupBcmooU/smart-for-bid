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
};

export function auditActionLabel(action: string): string {
  return LABELS[action] ?? action;
}
