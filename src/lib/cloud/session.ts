/**
 * Browser Helia Cloud session — JWT for dashboard management calls.
 * Prefers cookie / localStorage; optional public env for local development.
 */

const STORAGE_KEY = "helia_access_token";
const COOKIE_KEY = "helia_access_token";

export function getHeliaCloudBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_HELIA_CLOUD_URL?.replace(/\/$/, "") ||
    "http://localhost:4091"
  );
}

export function getHeliaAccessToken(): string | null {
  if (typeof window !== "undefined") {
    const fromStorage = window.localStorage.getItem(STORAGE_KEY)?.trim();
    if (fromStorage) return fromStorage;

    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([^;]+)`)
    );
    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  return process.env.NEXT_PUBLIC_HELIA_CLOUD_ACCESS_TOKEN?.trim() || null;
}

export function setHeliaAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  const value = token.trim();
  window.localStorage.setItem(STORAGE_KEY, value);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}

export function clearHeliaAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
}
