import { t, type Locale } from "./i18n";

export function roleLabel(locale: Locale, role: string) {
  const key = `roles.full.${role}`;
  const v = t(locale, key);
  return v === key ? role : v;
}

export function roleShort(locale: Locale, role: string) {
  const key = `roles.short.${role}`;
  const v = t(locale, key);
  return v === key ? role : v;
}

export function isInternal(role: string) {
  return role !== "VENDOR";
}

export function canApproveLevel(userRole: string, level: string) {
  const map: Record<string, string> = {
    N1: "N+1",
    N2: "N+2",
    N3: "N+3",
    N4: "N+4",
  };
  return map[userRole] === level;
}
