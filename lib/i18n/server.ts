import { cache } from "react";
import { type Locale } from "./index";

export { t, tr, LANG_COOKIE, DEFAULT_LOCALE } from "./index";
export type { Locale } from "./index";

/** Product UI is French-only for this direction; EN dict still compiles for types. */
export const getLocale = cache(async (): Promise<Locale> => {
  return "fr";
});
