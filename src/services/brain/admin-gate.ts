/**
 * Admin-only gate for Helia Brain (/api/brain/*).
 * Does not change login/session architecture — only enforces platform role.
 */

import { ForbiddenError } from "@/server/helia/utils/errors";
import { resolveHeliaAuthContext, type HeliaAuthContext } from "@/lib/auth/helia-session";
import { getCloudContainer } from "@/server/helia/runtime";
import { resolvePlatformRole } from "@/server/helia/cloud/utils";

export async function requireAdminBrainContext(
  request: Request
): Promise<HeliaAuthContext> {
  const auth = await resolveHeliaAuthContext(request.headers);
  const container = await getCloudContainer();
  const { user } = await container.auth.authenticateAccessToken(auth.accessToken);
  const ensured = await container.admin.ensureListedAdmin(user.id);
  if (resolvePlatformRole(ensured) !== "admin") {
    throw new ForbiddenError("Administrator access required.");
  }
  return auth;
}

export function brainRouteErrorResponse(error: unknown): {
  body: {
    ok: false;
    error: { message: string; code: string };
  };
  status: number;
} {
  const message =
    error instanceof Error ? error.message : "Helia Brain request failed";

  if (error instanceof ForbiddenError || /administrator access required/i.test(message)) {
    return {
      body: {
        ok: false,
        error: {
          message: "Administrator access required.",
          code: "FORBIDDEN",
        },
      },
      status: 403,
    };
  }

  const unauthorized = /session missing|log in|unauthorized|invalid access/i.test(
    message
  );
  return {
    body: {
      ok: false,
      error: {
        message,
        code: unauthorized ? "UNAUTHORIZED" : "BRAIN_FAILED",
      },
    },
    status: unauthorized ? 401 : 502,
  };
}
