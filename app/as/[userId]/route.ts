import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE } from "@/lib/session";

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (u) {
    const jar = await cookies();
    jar.set(USER_COOKIE, userId, { path: "/", httpOnly: false, sameSite: "lax" });
  }
  const next = new URL(req.url).searchParams.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(dest);
}
