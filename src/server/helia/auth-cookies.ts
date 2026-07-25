/**
 * Session cookie helpers for browser Helia auth (helia_access_token).
 * Server Set-Cookie is the source of truth for browser session auth.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const HELIA_ACCESS_COOKIE = "helia_access_token";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function isHttpsRequest(request?: Request): boolean {
  if (!request) {
    return (
      process.env.VERCEL === "1" || process.env.COOKIE_SECURE === "true"
    );
  }
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0]?.trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function accessCookieOptions(request?: Request) {
  return {
    path: "/",
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: isHttpsRequest(request),
  };
}

export async function attachAccessTokenCookie(
  response: NextResponse,
  accessToken: string,
  request?: Request
): Promise<NextResponse> {
  const token = accessToken.trim();
  const options = accessCookieOptions(request);

  response.cookies.set(HELIA_ACCESS_COOKIE, token, options);

  try {
    const jar = await cookies();
    jar.set(HELIA_ACCESS_COOKIE, token, options);
  } catch {
    // response.cookies.set is sufficient for the HTTP Set-Cookie header
  }

  return response;
}

export async function clearAccessTokenCookie(
  response: NextResponse,
  request?: Request
): Promise<NextResponse> {
  const options = {
    path: "/",
    sameSite: "lax" as const,
    maxAge: 0,
    httpOnly: true,
    secure: isHttpsRequest(request),
  };
  response.cookies.set(HELIA_ACCESS_COOKIE, "", options);
  try {
    const jar = await cookies();
    jar.set(HELIA_ACCESS_COOKIE, "", options);
  } catch {
    // ignore
  }
  return response;
}

export async function jsonOkWithAccessCookie<T extends Record<string, unknown>>(
  body: T,
  accessToken: string,
  init?: { status?: number; request?: Request }
): Promise<NextResponse> {
  const response = NextResponse.json(
    { ok: true, ...body },
    { status: init?.status ?? 200 }
  );
  return attachAccessTokenCookie(response, accessToken, init?.request);
}
