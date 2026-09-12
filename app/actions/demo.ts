"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { seedDemo } from "@/prisma/seed";
import { revalidateS2P } from "@/lib/revalidate";
import { isDemo } from "@/lib/demo";

export async function resetDemoData() {
  if (!isDemo()) {
    throw new Error("Reset demo data is only available in the demo.");
  }
  await seedDemo(prisma);
  revalidateS2P();
  redirect("/");
}
