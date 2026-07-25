import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";
import { ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

/** Validate a pasted customer API key (admin-only). */
export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const body = await readJsonBody<{ apiKey?: string }>(request);
    const apiKey = body.apiKey?.trim().replace(/^Bearer\s+/i, "").trim();
    if (!apiKey) throw new ValidationError("API key is required");

    const { getCloudContainer } = await import("@/server/helia/runtime");
    const container = await getCloudContainer();
    const ctx = await container.gateway.authenticateApiKey(apiKey);

    return jsonOk({
      valid: true,
      organization: {
        id: ctx.organization.id,
        name: ctx.organization.name,
        planId: ctx.plan.id,
        status: ctx.organization.status ?? "active",
      },
      project: {
        id: ctx.project.id,
        name: ctx.project.name,
        environment: ctx.project.environment,
      },
      application: {
        id: ctx.apiKey.id,
        name: ctx.apiKey.name,
        prefix: ctx.apiKey.prefix,
        lastFour: ctx.apiKey.lastFour,
        permissions: ctx.apiKey.permissions,
        capabilities: ctx.apiKey.capabilities ?? [],
        usageCount: ctx.apiKey.usageCount,
        lastUsedAt: ctx.apiKey.lastUsedAt ?? null,
        enabled: ctx.apiKey.enabled,
      },
      plan: {
        id: ctx.plan.id,
        name: ctx.plan.name,
        limits: ctx.plan.limits,
      },
      usage: ctx.usage,
      rateLimits: {
        windowMs: container.config.rateLimitWindowMs,
        max: container.config.rateLimitMax,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
