import { getBearerToken, jsonError, jsonOk } from "@/server/helia/http";
import { getCloudContainer } from "@/server/helia/runtime";
import { UnauthorizedError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

/** Was GET /v1/whoami on Helia Cloud gateway. */
export async function GET(request: Request) {
  try {
    const container = await getCloudContainer();
    const token = getBearerToken(request);
    if (!token) throw new UnauthorizedError("Missing Bearer API key");
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
    return jsonError(error);
  }
}
