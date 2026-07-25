/**
 * Client-side profile preferences (optional fields).
 * Core identity (name, email, verification) comes from /api/auth/me.
 */

import { cloudRequest } from "./http";

export type HeliaPublicUser = {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  role?: "user" | "admin";
  createdAt?: string;
  lastLoginAt?: string;
  disabledAt?: string;
};

export type ProfilePreferences = {
  companyName: string;
  phoneNumber: string;
  country: string;
  timeZone: string;
  language: string;
  /** data URL or empty */
  photoDataUrl: string;
};

const PREFS_PREFIX = "helia_profile_prefs_";

export const DEFAULT_PROFILE_PREFS: ProfilePreferences = {
  companyName: "",
  phoneNumber: "",
  country: "TR",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  language: "tr",
  photoDataUrl: "",
};

export async function fetchAuthMe(): Promise<{
  user: HeliaPublicUser;
  email?: string;
  role?: "user" | "admin";
  adminAccess?: {
    role: "user" | "admin";
    isAdmin: boolean;
  };
  organization?: unknown;
  permissions?: string[];
}> {
  const data = await cloudRequest<{
    ok: true;
    user: HeliaPublicUser;
    email?: string;
    role?: "user" | "admin";
    adminAccess?: {
      role: "user" | "admin";
      isAdmin: boolean;
    };
    organization?: unknown;
    permissions?: string[];
  }>("/api/auth/me");
  return data;
}

export function loadProfilePreferences(userId: string): ProfilePreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE_PREFS };
  try {
    const raw = window.localStorage.getItem(`${PREFS_PREFIX}${userId}`);
    if (!raw) return { ...DEFAULT_PROFILE_PREFS };
    const parsed = JSON.parse(raw) as Partial<ProfilePreferences>;
    return {
      ...DEFAULT_PROFILE_PREFS,
      ...parsed,
      timeZone:
        parsed.timeZone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC",
    };
  } catch {
    return { ...DEFAULT_PROFILE_PREFS };
  }
}

export function saveProfilePreferences(
  userId: string,
  prefs: ProfilePreferences
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${PREFS_PREFIX}${userId}`,
    JSON.stringify(prefs)
  );
}
