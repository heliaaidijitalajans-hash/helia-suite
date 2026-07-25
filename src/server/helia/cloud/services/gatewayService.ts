/**
 * Cloud gateway context — resolves API key → org/project/plan/usage.
 */

import { AppError, NotFoundError } from "../../utils/errors";
import { getPlan } from "../plans/catalog";
import type { CloudDatabase } from "../persistence/cloudDatabase";
import type { ApiKeyAuthContext } from "../types";
import { resolveOrganizationStatus } from "../utils";
import type { ApiKeyService } from "./apiKeyService";
import type { AuditLogService } from "./auditLogService";
import type { SubscriptionService } from "./subscriptionService";
import type { UsageService } from "./usageService";

export class GatewayService {
  private audit: AuditLogService | null = null;

  constructor(
    private readonly db: CloudDatabase,
    private readonly apiKeys: ApiKeyService,
    private readonly subscriptions: SubscriptionService,
    private readonly usage: UsageService
  ) {}

  /** Optional wiring after container construction (avoids circular ctor deps). */
  setAudit(audit: AuditLogService) {
    this.audit = audit;
  }

  async authenticateApiKey(bearerToken: string): Promise<ApiKeyAuthContext> {
    const apiKey = await this.apiKeys.authenticateBearer(bearerToken);
    const organization = await this.db.organizations.findById(
      apiKey.organizationId
    );
    if (!organization)
      throw new NotFoundError("Organization", apiKey.organizationId);
    if (resolveOrganizationStatus(organization) === "suspended") {
      throw new AppError("Organization suspended", {
        statusCode: 403,
        code: "ORG_SUSPENDED",
      });
    }
    const project = await this.db.projects.findById(apiKey.projectId);
    if (!project) throw new NotFoundError("Project", apiKey.projectId);
    const subscription = await this.subscriptions.assertActive(organization.id);
    const plan = getPlan(subscription.planId);
    const usage = await this.usage.assertWithinLimits({
      organizationId: organization.id,
      projectId: project.id,
      plan,
      metric: "requests",
    });
    return { apiKey, organization, project, subscription, plan, usage };
  }

  async trackRequest(
    ctx: ApiKeyAuthContext,
    kind:
      | "requests"
      | "brain_requests"
      | "monitoring_requests"
      | "errors" = "requests"
  ): Promise<void> {
    await this.usage.assertWithinLimits({
      organizationId: ctx.organization.id,
      projectId: ctx.project.id,
      plan: ctx.plan,
      metric: kind,
    });
    await this.usage.record({
      organizationId: ctx.organization.id,
      projectId: ctx.project.id,
      metric: kind,
    });
    if (kind !== "requests") {
      await this.usage.record({
        organizationId: ctx.organization.id,
        projectId: ctx.project.id,
        metric: "requests",
      });
    }
    if (this.audit) {
      await this.audit.write({
        level: kind === "errors" ? "error" : "info",
        category: "request",
        message: `API ${kind} via ${ctx.apiKey.name}`,
        organizationId: ctx.organization.id,
        projectId: ctx.project.id,
        apiKeyId: ctx.apiKey.id,
        meta: {
          application: ctx.apiKey.name,
          permissions: ctx.apiKey.permissions,
        },
      });
    }
  }
}
