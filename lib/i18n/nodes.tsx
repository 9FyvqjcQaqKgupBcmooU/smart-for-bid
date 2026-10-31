import type { ReactNode } from "react";
import { t, type Locale } from "./index";

/** Like t(), but wraps each {var} value in tabular figures (same sans family). */
export function tNum(locale: Locale, key: string, vars: Record<string, string | number>): ReactNode {
  const template = t(locale, key);
  const parts: ReactNode[] = [];
  const re = /\{(\w+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(template))) {
    if (m.index > last) parts.push(template.slice(last, m.index));
    const val = vars[m[1]];
    parts.push(
      <span key={i++} className="num">
        {val}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < template.length) parts.push(template.slice(last));
  return <>{parts}</>;
}
