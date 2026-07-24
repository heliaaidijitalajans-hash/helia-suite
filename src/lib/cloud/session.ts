/**
 * Browser Helia Cloud session helpers.
 * Same-origin only — no localhost / no external Cloud host.
 */

export function getHeliaCloudBaseUrl(): string {
  return "";
}

const STORAGE_KEY = "helia_access_token";
const COOKIE_KEY = "helia_access_token";

export function getHeliaAccessToken(): string | null {
  if (typeof window !== "undefined") {
    const fromStorage = window.localStorage.getItem(STORAGE_KEY)?.trim();
    if (fromStorage) return fromStorage;

    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([^;]+)`)
    );
    if (match?.[1]) {
      let value = match[1];
      try {
        value = decodeURIComponent(match[1]);
      } catch {
        // keep raw
      }
      const trimmed = value.trim();
      if (trimmed) {
        // Restore localStorage so subsequent API calls stay consistent.
        window.localStorage.setItem(STORAGE_KEY, trimmed);
        return trimmed;
      }
    }
  }

  return process.env.NEXT_PUBLIC_HELIA_CLOUD_ACCESS_TOKEN?.trim() || null;
}

export function setHeliaAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  const value = token.trim();
  window.localStorage.setItem(STORAGE_KEY, value);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
  window.dispatchEvent(new Event("helia-auth-changed"));
}

export function clearHeliaAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event("helia-auth-changed"));
}
