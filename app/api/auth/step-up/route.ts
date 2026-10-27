import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { recordStepUp } from "@/lib/authz";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled) {
    return NextResponse.json({ error: "MFA not enrolled" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { purpose?: string };
  const purpose = body.purpose || "key_open";
  await recordStepUp({
    userId: session.user.id,
    sessionId: session.session.id,
    purpose,
  });
  await audit({
    entityType: "Auth",
    entityId: session.user.id,
    action: "mfa_step_up",
    actorId: session.user.id,
    details: { purpose },
  });
  return NextResponse.json({ ok: true });
}
