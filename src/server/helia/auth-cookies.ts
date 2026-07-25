/**
 * Session cookie helpers for browser Helia auth (helia_access_token).
 * Server Set-Cookie so /api/* works without a manual Authorization header.
 */

import { NextResponse } from "next/server";

export const HELIA_ACCESS_COOKIE = "helia_access_token";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function accessCookieOptions() {
  return {
    path: "/",
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE,
    /** Readable by client session helpers; auth also accepts the cookie alone. */
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  };
}

export function attachAccessTokenCookie(
  response: NextResponse,
  accessToken: string
): NextResponse {
  response.cookies.set(
    HELIA_ACCESS_COOKIE,
    accessToken.trim(),
    accessCookieOptions()
  );
  return response;
}

export function clearAccessTokenCookie(response: NextResponse): NextResponse {
  response.cookies.set(HELIA_ACCESS_COOKIE, "", {
    path: "/",
    sameSite: "lax",
    maxAge: 0,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export function jsonOkWithAccessCookie<T extends Record<string, unknown>>(
  body: T,
  accessToken: string,
  init?: { status?: number }
): NextResponse {
  const response = NextResponse.json(
    { ok: true, ...body },
    { status: init?.status ?? 200 }
  );
  return attachAccessTokenCookie(response, accessToken);
}
