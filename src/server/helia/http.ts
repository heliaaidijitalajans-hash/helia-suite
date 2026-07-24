import { NextResponse } from "next/server";
import { AppError } from "@/server/helia/utils/errors";
import { getCloudContainer } from "@/server/helia/runtime";
import type { CloudContainer } from "@/server/helia/cloud/composition/container";
import type { CloudUser } from "@/server/helia/cloud/types";

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

export async function requireCloudUser(
  request: Request
): Promise<{ container: CloudContainer; user: CloudUser; accessToken: string }> {
  const container = await getCloudContainer();
  const token = getBearerToken(request);
  if (!token || token.startsWith("hl_live_") || token.startsWith("hl_test_")) {
    throw new AppError("Missing Bearer token", {
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  }
  const { user } = await container.auth.authenticateAccessToken(token);
  return { container, user, accessToken: token };
}

export function omitSecretHash<T extends { secretHash: string }>(
  record: T
): Omit<T, "secretHash"> {
  const { secretHash: _secretHash, ...rest } = record;
  return rest;
}
