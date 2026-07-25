/**
 * Usage tracking — monthly buckets per organization/project.
 */

import { createId } from '../../utils/id';
import { AppError } from '../../utils/errors';
import { getPlan } from '../plans/catalog';
import type { CloudDatabase } from '../persistence/cloudDatabase';
import type { PlanDefinition, UsageBucket, UsageMetric } from '../types';
import { currentMonthKey } from '../utils';

export class UsageService {
  constructor(private readonly db: CloudDatabase) {}

  async getOrCreateBucket(organizationId: string, projectId: string): Promise<UsageBucket> {
    const month = currentMonthKey();
    const existing = await this.db.usage.query(
      (u) =>
        u.organizationId === organizationId &&
        u.projectId === projectId &&
        u.month === month,
    );
    if (existing[0]) return existing[0];

    const bucket: UsageBucket = {
      id: createId('use'),
      organizationId,
      projectId,
      month,
      requests: 0,
      errors: 0,
      brainRequests: 0,
      monitoringRequests: 0,
      storageBytes: 0,
      bandwidthBytes: 0,
      updatedAt: new Date().toISOString(),
    };
    await this.db.usage.upsert(bucket);
    return bucket;
  }

  async record(input: {
    organizationId: string;
    projectId: string;
    metric: UsageMetric;
    amount?: number;
  }): Promise<UsageBucket> {
    const amount = input.amount ?? 1;
    const bucket = await this.getOrCreateBucket(input.organizationId, input.projectId);
    const next: UsageBucket = {
      ...bucket,
      updatedAt: new Date().toISOString(),
    };
    switch (input.metric) {
      case 'requests':
        next.requests += amount;
        break;
      case 'errors':
        next.errors += amount;
        break;
      case 'brain_requests':
        next.brainRequests += amount;
        break;
      case 'monitoring_requests':
        next.monitoringRequests += amount;
        break;
      case 'storage_bytes':
        next.storageBytes += amount;
        break;
      case 'bandwidth_bytes':
        next.bandwidthBytes += amount;
        break;
    }
    await this.db.usage.upsert(next);
    return next;
  }

  async assertWithinLimits(input: {
    organizationId: string;
    projectId: string;
    plan: PlanDefinition;
    metric: UsageMetric;
  }): Promise<UsageBucket> {
    const bucket = await this.getOrCreateBucket(input.organizationId, input.projectId);
    const limits = input.plan.limits;
    const checks: Array<{ ok: boolean; code: string; message: string }> = [
      {
        ok: bucket.requests < limits.monthlyRequests,
        code: 'REQUEST_LIMIT',
        message: 'Monthly request limit exceeded',
      },
      {
        ok: bucket.brainRequests < limits.monthlyBrainRequests,
        code: 'BRAIN_LIMIT',
        message: 'Monthly Brain request limit exceeded',
      },
      {
        ok: bucket.monitoringRequests < limits.monthlyMonitoringRequests,
        code: 'MONITORING_LIMIT',
        message: 'Monthly monitoring request limit exceeded',
      },
      {
        ok: bucket.storageBytes < limits.storageBytes,
        code: 'STORAGE_LIMIT',
        message: 'Storage limit exceeded',
      },
      {
        ok: bucket.bandwidthBytes < limits.bandwidthBytes,
        code: 'BANDWIDTH_LIMIT',
        message: 'Bandwidth limit exceeded',
      },
    ];

    // Only enforce the metric being incremented plus overall requests for gateway calls.
    const relevant =
      input.metric === 'requests'
        ? checks.filter((c) => c.code === 'REQUEST_LIMIT')
        : input.metric === 'brain_requests'
          ? checks.filter((c) => c.code === 'BRAIN_LIMIT' || c.code === 'REQUEST_LIMIT')
          : input.metric === 'monitoring_requests'
            ? checks.filter((c) => c.code === 'MONITORING_LIMIT' || c.code === 'REQUEST_LIMIT')
            : input.metric === 'storage_bytes'
              ? checks.filter((c) => c.code === 'STORAGE_LIMIT')
              : input.metric === 'bandwidth_bytes'
                ? checks.filter((c) => c.code === 'BANDWIDTH_LIMIT')
                : checks.filter((c) => c.code === 'REQUEST_LIMIT');

    const failed = relevant.find((c) => !c.ok);
    if (failed) {
      throw new AppError(failed.message, { statusCode: 429, code: failed.code });
    }
    return bucket;
  }

  async summarizeOrganization(organizationId: string): Promise<{
    month: string;
    buckets: UsageBucket[];
    totals: Omit<UsageBucket, 'id' | 'organizationId' | 'projectId' | 'month' | 'updatedAt'>;
  }> {
    const month = currentMonthKey();
    const buckets = await this.db.usage.query(
      (u) => u.organizationId === organizationId && u.month === month,
    );
    const totals = {
      requests: 0,
      errors: 0,
      brainRequests: 0,
      monitoringRequests: 0,
      storageBytes: 0,
      bandwidthBytes: 0,
    };
    for (const b of buckets) {
      totals.requests += b.requests;
      totals.errors += b.errors;
      totals.brainRequests += b.brainRequests;
      totals.monitoringRequests += b.monitoringRequests;
      totals.storageBytes += b.storageBytes;
      totals.bandwidthBytes += b.bandwidthBytes;
    }
    return { month, buckets, totals };
  }

  async summarizeForUserOrgs(organizationIds: string[]) {
    const month = currentMonthKey();
    const all = await this.db.usage.query(
      (u) => organizationIds.includes(u.organizationId) && u.month === month,
    );
    return { month, buckets: all };
  }

  /** Platform-wide usage totals for the current month (Admin / Helia Chat). */
  async summarizePlatform(): Promise<{
    month: string;
    bucketCount: number;
    totals: {
      requests: number;
      errors: number;
      brainRequests: number;
      monitoringRequests: number;
      storageBytes: number;
      bandwidthBytes: number;
    };
  }> {
    const month = currentMonthKey();
    const buckets = await this.db.usage.query((u) => u.month === month);
    const totals = {
      requests: 0,
      errors: 0,
      brainRequests: 0,
      monitoringRequests: 0,
      storageBytes: 0,
      bandwidthBytes: 0,
    };
    for (const b of buckets) {
      totals.requests += b.requests;
      totals.errors += b.errors;
      totals.brainRequests += b.brainRequests;
      totals.monitoringRequests += b.monitoringRequests;
      totals.storageBytes += b.storageBytes;
      totals.bandwidthBytes += b.bandwidthBytes;
    }
    return { month, bucketCount: buckets.length, totals };
  }
}

export function planForOrganizationPlanId(planId: Parameters<typeof getPlan>[0]): PlanDefinition {
  return getPlan(planId);
}
