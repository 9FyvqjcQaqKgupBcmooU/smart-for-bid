import { acceptOrgInvitation } from "@/app/actions/orgs";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import { notFound } from "next/navigation";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await requireAuthUser();
  const inv = await prisma.orgInvitation.findUnique({ where: { token }, include: { org: true } });
  if (!inv) notFound();
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Join {inv.org.name}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Role: {inv.orgRole} · expires {inv.expiresAt.toISOString()}
      </p>
      <form
        action={async () => {
          "use server";
          await acceptOrgInvitation(token);
        }}
        className="mt-6"
      >
        <button type="submit" className="rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white">
          Accept invitation
        </button>
      </form>
    </div>
  );
}
