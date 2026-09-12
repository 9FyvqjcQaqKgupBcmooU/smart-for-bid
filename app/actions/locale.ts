"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANG_COOKIE } from "@/lib/i18n";

export async function setLocale(formData: FormData) {
  const raw = String(formData.get("locale") ?? "en");
  const locale = raw === "fr" ? "fr" : "en";
  const jar = await cookies();
  jar.set(LANG_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
