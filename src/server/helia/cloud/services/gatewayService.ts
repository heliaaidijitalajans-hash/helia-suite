/**
 * Cloud gateway context — resolves API key → org/project/plan/usage.
 */

import { NotFoundError } from '../../utils/errors';
import { getPlan } from '../plans/catalog';
import type { CloudDatabase } from '../persistence/cloudDatabase';
import type { ApiKeyAuthContext } from '../types';
import type { ApiKeyService } from './apiKeyService';
import type { SubscriptionService } from './subscriptionService';
import type { UsageService } from './usageService';

export class GatewayService {
  constructor(
    private readonly db: CloudDatabase,
    private readonly apiKeys: ApiKeyService,
    private readonly subscriptions: SubscriptionService,
    private readonly usage: UsageService,
  ) {}

  async authenticateApiKey(bearerToken: string): Promise<ApiKeyAuthContext> {
    const apiKey = await this.apiKeys.authenticateBearer(bearerToken);
    const organization = await this.db.organizations.findById(apiKey.organizationId);
    if (!organization) throw new NotFoundError('Organization', apiKey.organizationId);
    const project = await this.db.projects.findById(apiKey.projectId);
    if (!project) throw new NotFoundError('Project', apiKey.projectId);
    const subscription = await this.subscriptions.assertActive(organization.id);
    const plan = getPlan(subscription.planId);
    const usage = await this.usage.assertWithinLimits({
      organizationId: organization.id,
      projectId: project.id,
      plan,
      metric: 'requests',
    });
    return { apiKey, organization, project, subscription, plan, usage };
  }

  async trackRequest(
    ctx: ApiKeyAuthContext,
    kind: 'requests' | 'brain_requests' | 'monitoring_requests' | 'errors' = 'requests',
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
    if (kind !== 'requests') {
      await this.usage.record({
        organizationId: ctx.organization.id,
        projectId: ctx.project.id,
        metric: 'requests',
      });
    }
  }
}
