/**
 * Stubbed email delivery — no provider is configured.
 * Invitations are shown as copyable links to the inviter.
 * Magic-link / OTP delivery logs to the console in development only.
 */
export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function stubSendEmail(msg: EmailMessage): Promise<{ ok: true; stubbed: true }> {
  if (process.env.NODE_ENV !== "production") {
    console.info("[email:stub]", { to: msg.to, subject: msg.subject, text: msg.text.slice(0, 200) });
  }
  return { ok: true, stubbed: true };
}

/** Build a copyable org invite URL (no email sent). */
export function inviteLinkForToken(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.BETTER_AUTH_URL || "http://127.0.0.1:3100";
  return `${base.replace(/\/$/, "")}/invite/${token}`;
}
