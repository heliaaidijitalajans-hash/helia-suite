import { getBearerToken, jsonError, jsonOk } from "@/server/helia/http";
import { getCloudContainer } from "@/server/helia/runtime";
import { AppError } from "@/server/helia/utils/errors";
import { parseApiKeyEnvironment } from "@/server/helia/cloud/crypto/apiKey";

export const runtime = "nodejs";

function redactToken(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 12) return "***";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

/** Auth-related headers actually present on the incoming Request (redacted). */
function receivedAuthHeaders(request: Request): Record<string, string | null> {
  const authorization = request.headers.get("authorization");
  const xApiKey = request.headers.get("x-api-key");
  return {
    authorization: authorization
      ? authorization.startsWith("Bearer ")
        ? `Bearer ${redactToken(authorization.slice("Bearer ".length))}`
        : "***"
      : null,
    "x-api-key": redactToken(xApiKey),
  };
}

/** Was GET /v1/whoami on Helia Cloud gateway. */
export async function GET(request: Request) {
  const receivedHeaders = receivedAuthHeaders(request);
  try {
    const container = await getCloudContainer();
    const token = getBearerToken(request);
    if (!token) {
      throw new AppError("Missing Bearer API key", {
        statusCode: 401,
        code: "UNAUTHORIZED",
        details: {
          receivedHeaders,
          note: "whoami only reads Authorization: Bearer <apiKey>. X-API-Key is ignored.",
        },
      });
    }

    const env = parseApiKeyEnvironment(token);
    try {
      const ctx = await container.gateway.authenticateApiKey(token);
      await container.gateway.trackRequest(ctx, "requests");
      return jsonOk({
        organization: {
          id: ctx.organization.id,
          name: ctx.organization.name,
          planId: ctx.plan.id,
        },
        project: {
          id: ctx.project.id,
          name: ctx.project.name,
          environment: ctx.project.environment,
        },
        apiKey: {
          id: ctx.apiKey.id,
          name: ctx.apiKey.name,
          prefix: ctx.apiKey.prefix,
          permissions: ctx.apiKey.permissions,
          usageCount: ctx.apiKey.usageCount,
        },
        plan: {
          id: ctx.plan.id,
          name: ctx.plan.name,
          limits: ctx.plan.limits,
        },
        usage: ctx.usage,
      });
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 401) {
        const enabledForEnv = env
          ? (
              await container.db.apiKeys.query(
                (k) => k.keyEnvironment === env && k.enabled
              )
            ).length
          : 0;
        const totalKeys = (await container.db.apiKeys.findAll()).length;
        throw new AppError(error.message, {
          statusCode: 401,
          code: error.code,
          details: {
            receivedHeaders,
            bearerPresent: true,
            tokenLength: token.length,
            tokenPrefix: token.slice(0, 8),
            parsedEnvironment: env ?? null,
            enabledCandidatesForEnv: enabledForEnv,
            totalApiKeysInStore: totalKeys,
            whoamiReads: "Authorization Bearer only (raw token after 'Bearer ')",
            xApiKeyIgnored: true,
            failureStage: !env
              ? "parseApiKeyEnvironment"
              : enabledForEnv === 0
                ? "no_enabled_candidates"
                : "hash_mismatch_or_wrong_pepper",
          },
        });
      }
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
