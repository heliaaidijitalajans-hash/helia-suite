/**
 * Browser Helia Cloud session helpers.
 * Access JWT for API Bearer is in localStorage.
 * Browser session auth cookie (HttpOnly) is set only by the server via Set-Cookie.
 */

export function getHeliaCloudBaseUrl(): string {
  return "";
}

const STORAGE_KEY = "helia_access_token";

export function getHeliaAccessToken(): string | null {
  if (typeof window !== "undefined") {
    const fromStorage = window.localStorage.getItem(STORAGE_KEY)?.trim();
    if (fromStorage) return fromStorage;
  }
  return process.env.NEXT_PUBLIC_HELIA_CLOUD_ACCESS_TOKEN?.trim() || null;
}

/** Persist access token for optional Bearer header (XHR). Cookie is server-owned. */
export function setHeliaAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  const value = token.trim();
  window.localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new Event("helia-auth-changed"));
}

export function clearHeliaAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  // Best-effort clear of any legacy non-HttpOnly cookie from older builds
  document.cookie = `${STORAGE_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event("helia-auth-changed"));
}
