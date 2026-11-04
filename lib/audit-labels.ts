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
  dossier_change: "Dossier updated — all suppliers notified",
  post_bid_change: "POST-BID CHANGE",
  qa_question: "Supplier question received (asker anonymised)",
  qa_answer: "Q&A answer broadcast to all suppliers",
  dossier_viewed: "Dossier viewed by supplier",
  dossier_ack: "Dossier acknowledged by supplier",
  sealed_access_denied: "Sealed data access denied",
};

export function auditActionLabel(action: string): string {
  return LABELS[action] ?? action;
}

export type EventDetails = {
  version?: number;
  hash?: string;
  dossierVersion?: number;
  dossierHash?: string;
  field?: string;
  before?: string;
  after?: string;
  postBid?: boolean;
  route?: string;
  reason?: string;
  summary?: string;
};

export function parseDetails(raw: string): EventDetails {
  try {
    return JSON.parse(raw || "{}") as EventDetails;
  } catch {
    return {};
  }
}

export function clip(s: string | undefined, n = 160): string {
  if (!s) return "";
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > n ? one.slice(0, n - 1) + "…" : one;
}
