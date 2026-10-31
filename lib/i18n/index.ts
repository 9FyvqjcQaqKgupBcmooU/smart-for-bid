import { en } from "./en";
import { fr } from "./fr";

export const LANG_COOKIE = "pli-lang";
export type Locale = "en" | "fr";
export const DEFAULT_LOCALE: Locale = "en";

export { en, fr };

type DictNode = { [k: string]: string | DictNode };

function lookup(dict: DictNode, key: string): string | undefined {
  let cur: string | DictNode | undefined = dict;
  for (const p of key.split(".")) {
    if (!cur || typeof cur === "string") return undefined;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const primary = (locale === "fr" ? fr : en) as unknown as DictNode;
  const fallback = en as unknown as DictNode;
  let s = lookup(primary, key) ?? lookup(fallback, key) ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function tr(locale: Locale) {
  return (key: string, vars?: Record<string, string | number>) => t(locale, key, vars);
}
