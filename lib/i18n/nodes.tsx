import type { ReactNode } from "react";
import { Fragment } from "react";
import { t, type Locale } from "./index";

/** Like t(), but wraps each {var} value in IBM Plex Mono tabular figures. */
export function tNum(locale: Locale, key: string, vars: Record<string, string | number>): ReactNode {
  const template = t(locale, key);
  const parts = template.split(/(\{[a-zA-Z]+\})/g);
  return parts.map((p, i) => {
    const m = /^\{([a-zA-Z]+)\}$/.exec(p);
    if (m && m[1] in vars) {
      return (
        <span key={i} className="num">
          {String(vars[m[1]])}
        </span>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}
