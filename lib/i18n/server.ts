import { cache } from "react";
import { cookies } from "next/headers";
import { LANG_COOKIE, type Locale } from "./index";

export { t, tr, LANG_COOKIE, DEFAULT_LOCALE } from "./index";
export type { Locale } from "./index";

export const getLocale = cache(async (): Promise<Locale> => {
  const jar = await cookies();
  const v = jar.get(LANG_COOKIE)?.value;
  return v === "fr" ? "fr" : "en";
});
