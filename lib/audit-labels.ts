const LABELS: Record<string, string> = {
  create: "Draft created",
  publish: "RFQ published — invitations sent",
  invite: "Supplier invited",
  briefing_edit: "Briefing updated (addendum)",
  bid_submit: "Offer submitted",
  unlock_ok: "Key accepted",
  unlock_fail: "Key attempt rejected",
  key_unlock_A: "Key A accepted",
  key_unlock_B: "Key B accepted",
  open: "Envelope opened — offers revealed",
  opened: "Envelope opened — offers revealed",
  award: "Award recorded",
  deadline_passed: "Deadline reached — envelopes sealed",
  validation_request: "Submitted for N+1 approval",
  validation_ok: "Approved by Approver (N+1)",
  validation_return: "Returned by Approver",
  conditions_accepted: "Non-negotiable conditions accepted",
  org_conditions_edit: "Organisation conditions updated",
};

export function auditActionLabel(action: string): string {
  return LABELS[action] ?? action;
}
