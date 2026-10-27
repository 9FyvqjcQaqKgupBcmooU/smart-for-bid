"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import { audit } from "@/lib/audit";
import { inviteLinkForToken } from "@/lib/email";
import { requireOrgRole, assertMfaEnrolled, type OrgRole } from "@/lib/authz";

export async function createOrganization(formData: FormData) {
  const { user, twoFactorEnabled } = await requireAuthUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "buyer") as "buyer" | "supplier";
  if (!name) throw new Error("Name required");
  if (type !== "buyer" && type !== "supplier") throw new Error("Invalid type");

  let vendorId: string | undefined;
  if (type === "supplier") {
    const vendor = await prisma.vendor.create({
      data: {
        name,
        legalName: name,
        email: user.email,
        category: "Supplier",
      },
    });
    vendorId = vendor.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { vendorId, role: "VENDOR" },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "BUYER" },
    });
  }

  const org = await prisma.organization.create({
    data: {
      name,
      type,
      vendorId,
      memberships: {
        create: { userId: user.id, orgRole: "owner" },
      },
    },
  });

  await audit({
    entityType: "Organization",
    entityId: org.id,
    action: "org_create",
    actorId: user.id,
    orgId: org.id,
    details: { name, type },
  });

  // Owners need MFA — nudge enrollment
  if (!twoFactorEnabled) {
    redirect("/mfa/enroll");
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function createOrgInvitation(formData: FormData) {
  const { user, twoFactorEnabled } = await requireAuthUser();
  await assertMfaEnrolled(user.id, twoFactorEnabled);
  const orgId = String(formData.get("orgId"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const orgRole = (String(formData.get("orgRole") ?? "member") as OrgRole) || "member";
  await requireOrgRole(user.id, orgId, ["owner", "admin"]);
  if (!email) throw new Error("Email required");

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.orgInvitation.create({
    data: {
      orgId,
      email,
      token,
      orgRole,
      invitedById: user.id,
      expiresAt,
    },
  });
  await audit({
    entityType: "Organization",
    entityId: orgId,
    action: "org_invite",
    actorId: user.id,
    orgId,
    details: { email, orgRole },
  });
  revalidatePath("/", "layout");
  return { inviteLink: inviteLinkForToken(token) };
}

export async function acceptOrgInvitation(token: string) {
  const { user } = await requireAuthUser();
  const inv = await prisma.orgInvitation.findUnique({ where: { token }, include: { org: true } });
  if (!inv || inv.acceptedAt || inv.expiresAt < new Date()) {
    throw new Error("Invitation invalid or expired");
  }
  if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error("Invitation email does not match signed-in user");
  }
  await prisma.membership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: inv.orgId } },
    update: { orgRole: inv.orgRole },
    create: { userId: user.id, orgId: inv.orgId, orgRole: inv.orgRole },
  });
  if (inv.org.type === "supplier" && inv.org.vendorId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { vendorId: inv.org.vendorId, role: "VENDOR" },
    });
  }
  await prisma.orgInvitation.update({
    where: { id: inv.id },
    data: { acceptedAt: new Date() },
  });
  await audit({
    entityType: "Organization",
    entityId: inv.orgId,
    action: "org_invite_accept",
    actorId: user.id,
    orgId: inv.orgId,
  });
  revalidatePath("/", "layout");
  redirect("/");
}
