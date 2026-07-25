import { defaultLocale, isLocale, type Locale } from "@/config/i18n";

export const HELIA_UI_LOCALE_COOKIE = "helia_ui_locale";

export function parseUiLocale(raw: string | undefined | null): Locale {
  if (raw && isLocale(raw)) return raw;
  return defaultLocale;
}

/** Cookie write for client-side language switch (dashboard / admin). */
export function setUiLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${HELIA_UI_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function readUiLocaleFromDocument(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${HELIA_UI_LOCALE_COOKIE}=([^;]+)`)
  );
  return parseUiLocale(match?.[1]);
}
