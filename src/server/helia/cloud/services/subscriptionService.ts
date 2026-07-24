/**
 * Subscription service — plan assignment architecture (no payment provider).
 */

import { createId } from '../../utils/id.js';
import { UnauthorizedError, ValidationError } from '../../utils/errors.js';
import { getPlan, listPlans } from '../plans/catalog.js';
import type { CloudDatabase } from '../persistence/cloudDatabase.js';
import type { PlanId, SubscriptionRecord } from '../types.js';
import { addDaysIso } from '../utils.js';
import type { OrganizationService } from './organizationService.js';

export class SubscriptionService {
  constructor(
    private readonly db: CloudDatabase,
    private readonly organizations: OrganizationService,
  ) {}

  listPlans() {
    return listPlans();
  }

  async getForOrganization(
    organizationId: string,
    userId: string,
  ): Promise<SubscriptionRecord> {
    await this.organizations.requireMembership(organizationId, userId);
    return this.requireSubscription(organizationId);
  }

  async requireSubscription(organizationId: string): Promise<SubscriptionRecord> {
    const subs = await this.db.subscriptions.query((s) => s.organizationId === organizationId);
    const active = subs.find((s) => s.status === 'active' || s.status === 'trialing') ?? subs[0];
    if (!active) {
      // Self-heal missing subscription for legacy rows.
      const now = new Date().toISOString();
      const created: SubscriptionRecord = {
        id: createId('sub'),
        organizationId,
        planId: 'free',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: addDaysIso(30),
        billingProvider: 'none',
        createdAt: now,
        updatedAt: now,
      };
      await this.db.subscriptions.upsert(created);
      return created;
    }
    return active;
  }

  async changePlan(input: {
    userId: string;
    organizationId: string;
    planId: PlanId;
  }): Promise<SubscriptionRecord> {
    await this.organizations.requireMembership(input.organizationId, input.userId, 'owner');
    if (!listPlans().some((p) => p.id === input.planId)) {
      throw new ValidationError('Unknown plan');
    }
    getPlan(input.planId);
    const current = await this.requireSubscription(input.organizationId);
    const now = new Date().toISOString();
    const updated: SubscriptionRecord = {
      ...current,
      planId: input.planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: addDaysIso(30),
      billingProvider: 'none',
      updatedAt: now,
    };
    await this.db.subscriptions.upsert(updated);
    await this.db.organizations.patch(input.organizationId, {
      planId: input.planId,
      updatedAt: now,
    });
    return updated;
  }

  async assertActive(organizationId: string): Promise<SubscriptionRecord> {
    const sub = await this.requireSubscription(organizationId);
    if (sub.status === 'canceled') {
      throw new UnauthorizedError('Subscription canceled');
    }
    return sub;
  }
}
