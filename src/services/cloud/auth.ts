/**
 * Helia Cloud auth client — same-origin /api/auth/* only.
 */

import {
  clearHeliaAccessToken,
  setHeliaAccessToken,
} from "@/lib/cloud/session";

const REFRESH_KEY = "helia_refresh_token";

export type HeliaAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
};

export type HeliaAuthUser = {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
};

type AuthSuccess = {
  ok: true;
  user: HeliaAuthUser;
  tokens?: HeliaAuthTokens;
};

function persistTokens(tokens: HeliaAuthTokens) {
  setHeliaAccessToken(tokens.accessToken);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
}

async function authRequest(
  path: string,
  body: Record<string, string>
): Promise<AuthSuccess> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as
    | (AuthSuccess & { error?: { message?: string } })
    | { ok?: false; error?: { message?: string } }
    | null;

  if (!res.ok || !data || data.ok === false) {
    throw new Error(
      data?.error?.message || `Authentication failed (${res.status})`
    );
  }

  return data as AuthSuccess;
}

export async function loginWithHeliaCloud(input: {
  email: string;
  password: string;
}): Promise<HeliaAuthUser> {
  const data = await authRequest("/api/auth/login", {
    email: input.email.trim(),
    password: input.password,
  });
  if (!data.tokens?.accessToken) {
    throw new Error("Login succeeded but no access token was returned.");
  }
  persistTokens(data.tokens);
  return data.user;
}

export async function registerWithHeliaCloud(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<HeliaAuthUser> {
  const data = await authRequest("/api/auth/register", {
    email: input.email.trim(),
    password: input.password,
    displayName:
      input.displayName?.trim() ||
      input.email.trim().split("@")[0] ||
      "User",
  });

  if (data.tokens?.accessToken) {
    persistTokens(data.tokens);
    return data.user;
  }

  return loginWithHeliaCloud({
    email: input.email,
    password: input.password,
  });
}

export async function logoutHeliaCloud(): Promise<void> {
  let refreshToken: string | null = null;
  if (typeof window !== "undefined") {
    refreshToken = window.localStorage.getItem(REFRESH_KEY);
  }

  try {
    if (refreshToken) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    }
  } catch {
    // Local clear still proceeds.
  }

  clearHeliaAccessToken();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(REFRESH_KEY);
  }
}

export function safeAuthNextPath(
  next: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  if (next.startsWith("/login") || next.startsWith("/register")) {
    return fallback;
  }

  const parts = next.split("/").filter(Boolean);

  // /en/dashboard/api-keys → /dashboard/api-keys
  if (parts[0] === "en" || parts[0] === "tr") {
    if (parts[1] === "dashboard") {
      return "/" + parts.slice(1).join("/");
    }
    if (
      parts.length === 2 &&
      [
        "api-keys",
        "profile",
        "usage",
        "documentation",
        "integrations",
        "settings",
      ].includes(parts[1]!)
    ) {
      return `/dashboard/${parts[1]}`;
    }
  }

  // /api-keys → /dashboard/api-keys
  if (
    parts.length === 1 &&
    [
      "api-keys",
      "profile",
      "usage",
      "documentation",
      "integrations",
      "settings",
    ].includes(parts[0]!)
  ) {
    return `/dashboard/${parts[0]}`;
  }

  return next;
}
