/**
 * Organizations — multi-org ownership with memberships and default Free subscription.
 */

import { createId } from '../../utils/id';
import { AppError, NotFoundError, UnauthorizedError, ValidationError } from '../../utils/errors';
import { getPlan } from '../plans/catalog';
import type { CloudDatabase } from '../persistence/cloudDatabase';
import type {
  Organization,
  OrganizationMembership,
  OrgRole,
  PlanId,
  SubscriptionRecord,
} from '../types';
import { addDaysIso, slugify } from '../utils';

export class OrganizationService {
  constructor(private readonly db: CloudDatabase) {}

  async create(input: {
    userId: string;
    name: string;
    planId?: PlanId;
  }): Promise<{ organization: Organization; membership: OrganizationMembership }> {
    const name = input.name.trim();
    if (name.length < 2) throw new ValidationError('Organization name is required');

    const owned = await this.db.organizations.query((o) => o.ownerUserId === input.userId);
    const planId = input.planId ?? 'free';
    const plan = getPlan(planId);
    if (owned.length >= plan.limits.maxOrganizations && planId === 'free') {
      // Free plan org count is enforced against free orgs; upgraded plans use their own limits.
      const freeOwned = owned.filter((o) => o.planId === 'free');
      if (freeOwned.length >= getPlan('free').limits.maxOrganizations && planId === 'free') {
        throw new AppError('Free plan organization limit reached', {
          statusCode: 402,
          code: 'PLAN_LIMIT',
        });
      }
    }

    const now = new Date().toISOString();
    let slug = slugify(name);
    const collisions = await this.db.organizations.query((o) => o.slug === slug);
    if (collisions.length > 0) slug = `${slug}-${createId('x').slice(-6)}`;

    const organization: Organization = {
      id: createId('org'),
      name,
      slug,
      ownerUserId: input.userId,
      planId,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.organizations.upsert(organization);

    const membership: OrganizationMembership = {
      id: createId('mem'),
      organizationId: organization.id,
      userId: input.userId,
      role: 'owner',
      createdAt: now,
    };
    await this.db.memberships.upsert(membership);

    const subscription: SubscriptionRecord = {
      id: createId('sub'),
      organizationId: organization.id,
      planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: addDaysIso(30),
      billingProvider: 'none',
      createdAt: now,
      updatedAt: now,
    };
    await this.db.subscriptions.upsert(subscription);

    return { organization, membership };
  }

  async listForUser(userId: string): Promise<Organization[]> {
    const memberships = await this.db.memberships.query((m) => m.userId === userId);
    const orgs: Organization[] = [];
    for (const membership of memberships) {
      const org = await this.db.organizations.findById(membership.organizationId);
      if (org) orgs.push(org);
    }
    return orgs;
  }

  async getForUser(organizationId: string, userId: string): Promise<Organization> {
    await this.requireMembership(organizationId, userId);
    const org = await this.db.organizations.findById(organizationId);
    if (!org) throw new NotFoundError('Organization', organizationId);
    return org;
  }

  async requireMembership(
    organizationId: string,
    userId: string,
    minRole?: OrgRole,
  ): Promise<OrganizationMembership> {
    const memberships = await this.db.memberships.query(
      (m) => m.organizationId === organizationId && m.userId === userId,
    );
    const membership = memberships[0];
    if (!membership) throw new UnauthorizedError('Not a member of this organization');
    if (minRole && !roleAtLeast(membership.role, minRole)) {
      throw new UnauthorizedError(`Requires ${minRole} role or higher`);
    }
    return membership;
  }
}

const ROLE_RANK: Record<OrgRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

function roleAtLeast(actual: OrgRole, required: OrgRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}
