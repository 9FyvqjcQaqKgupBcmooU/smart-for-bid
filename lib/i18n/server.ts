import { cache } from "react";
import { type Locale } from "./index";

export { t, tr, LANG_COOKIE, DEFAULT_LOCALE } from "./index";
export type { Locale } from "./index";

/** Product UI defaults to English (neutral roles). FR dict remains for optional i18n. */
export const getLocale = cache(async (): Promise<Locale> => {
  return "en";
});
