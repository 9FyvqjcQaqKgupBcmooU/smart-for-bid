import { cache } from "react";
import { cookies, headers } from "next/headers";

export const THEME_COOKIE = "pli-theme";
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export const DEFAULT_THEME: ThemePreference = "light";

export function parseTheme(raw: string | undefined | null): ThemePreference {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return DEFAULT_THEME;
}

export const getThemePreference = cache(async (): Promise<ThemePreference> => {
  const jar = await cookies();
  return parseTheme(jar.get(THEME_COOKIE)?.value);
});

/** Resolve cookie to a concrete light/dark class for <html>. */
export const getTheme = cache(async (): Promise<ResolvedTheme> => {
  const preference = await getThemePreference();
  if (preference === "light" || preference === "dark") return preference;
  const h = await headers();
  const hint = (
    h.get("Sec-CH-Prefers-Color-Scheme") ??
    h.get("sec-ch-prefers-color-scheme") ??
    ""
  ).toLowerCase();
  return hint === "dark" ? "dark" : "light";
});

/** Inline boot: if cookie is system, apply matchMedia before paint. */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )pli-theme=([^;]*)/);var p=m?decodeURIComponent(m[1]):"light";if(p==="light"){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";return;}if(p==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";return;}var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
