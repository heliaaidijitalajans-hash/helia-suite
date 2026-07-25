import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AppError, ForbiddenError } from "@/server/helia/utils/errors";
import { getCloudContainer } from "@/server/helia/runtime";
import type { CloudContainer } from "@/server/helia/cloud/composition/container";
import type { CloudUser } from "@/server/helia/cloud/types";
import { resolvePlatformRole } from "@/server/helia/cloud/utils";
import { HELIA_ACCESS_COOKIE } from "@/server/helia/auth-cookies";

export function jsonOk<T extends Record<string, unknown>>(
  body: T,
  init?: { status?: number }
) {
  return NextResponse.json({ ok: true, ...body }, { status: init?.status ?? 200 });
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message } },
    { status: 500 }
  );
}

export async function readJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<T> {
  return ((await request.json().catch(() => ({}))) ?? {}) as T;
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

function normalizeAccessToken(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // keep raw
  }
  value = value.trim();
  if (!value || value.startsWith("hl_live_") || value.startsWith("hl_test_")) {
    return null;
  }
  return value;
}

/**
 * JWT access token from:
 * 1) Authorization: Bearer <jwt>
 * 2) Cookie header helia_access_token
 * 3) Next.js cookies() store (same name)
 */
export async function getAccessTokenFromRequest(
  request: Request
): Promise<string | null> {
  const bearer = getBearerToken(request);
  const fromBearer = normalizeAccessToken(bearer);
  if (fromBearer) return fromBearer;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${HELIA_ACCESS_COOKIE}=([^;]+)`)
  );
  const fromHeader = normalizeAccessToken(match?.[1]);
  if (fromHeader) return fromHeader;

  try {
    const jar = await cookies();
    const fromStore = normalizeAccessToken(
      jar.get(HELIA_ACCESS_COOKIE)?.value
    );
    if (fromStore) return fromStore;
  } catch {
    // cookies() unavailable outside a request context
  }

  return null;
}

export async function requireCloudUser(
  request: Request
): Promise<{ container: CloudContainer; user: CloudUser; accessToken: string }> {
  const container = await getCloudContainer();
  const token = await getAccessTokenFromRequest(request);
  if (!token) {
    throw new AppError(
      "Missing authentication (Authorization Bearer or helia_access_token cookie)",
      {
        statusCode: 401,
        code: "UNAUTHORIZED",
      }
    );
  }
  const { user } = await container.auth.authenticateAccessToken(token);
  return { container, user, accessToken: token };
}

/** Platform admin only — used by `/api/admin/*` and Admin Panel gates. */
export async function requireAdminUser(
  request: Request
): Promise<{ container: CloudContainer; user: CloudUser; accessToken: string }> {
  const ctx = await requireCloudUser(request);
  const ensured = await ctx.container.admin.ensureListedAdmin(ctx.user.id);
  if (resolvePlatformRole(ensured) !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  return { ...ctx, user: ensured };
}

export function omitSecretHash<T extends { secretHash: string }>(
  record: T
): Omit<T, "secretHash"> {
  const { secretHash: _secretHash, ...rest } = record;
  return rest;
}
