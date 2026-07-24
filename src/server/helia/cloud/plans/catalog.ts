/**
 * Subscription plan catalog — billing-provider ready, no payment integration yet.
 */

import type { PlanDefinition, PlanId } from '../types.js';

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Evaluate Helia with limited monthly quotas.',
    monthlyPriceUsd: 0,
    limits: {
      maxOrganizations: 1,
      maxProjectsPerOrg: 2,
      maxApiKeysPerProject: 2,
      monthlyRequests: 5_000,
      monthlyBrainRequests: 200,
      monthlyMonitoringRequests: 2_000,
      storageBytes: 100 * 1024 * 1024,
      bandwidthBytes: 1 * 1024 * 1024 * 1024,
    },
    features: ['dashboard', 'api_keys', 'basic_monitoring'],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams bringing a first production project online.',
    monthlyPriceUsd: 29,
    limits: {
      maxOrganizations: 2,
      maxProjectsPerOrg: 5,
      maxApiKeysPerProject: 5,
      monthlyRequests: 50_000,
      monthlyBrainRequests: 2_000,
      monthlyMonitoringRequests: 25_000,
      storageBytes: 2 * 1024 * 1024 * 1024,
      bandwidthBytes: 20 * 1024 * 1024 * 1024,
    },
    features: ['dashboard', 'api_keys', 'monitoring', 'brain', 'email_support'],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Production-grade quotas for growing products.',
    monthlyPriceUsd: 99,
    limits: {
      maxOrganizations: 5,
      maxProjectsPerOrg: 20,
      maxApiKeysPerProject: 20,
      monthlyRequests: 250_000,
      monthlyBrainRequests: 15_000,
      monthlyMonitoringRequests: 150_000,
      storageBytes: 20 * 1024 * 1024 * 1024,
      bandwidthBytes: 200 * 1024 * 1024 * 1024,
    },
    features: ['dashboard', 'api_keys', 'monitoring', 'brain', 'operator', 'priority_support'],
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'Multi-project organizations with elevated limits.',
    monthlyPriceUsd: 299,
    limits: {
      maxOrganizations: 20,
      maxProjectsPerOrg: 100,
      maxApiKeysPerProject: 50,
      monthlyRequests: 1_000_000,
      monthlyBrainRequests: 75_000,
      monthlyMonitoringRequests: 750_000,
      storageBytes: 100 * 1024 * 1024 * 1024,
      bandwidthBytes: 1 * 1024 * 1024 * 1024 * 1024,
    },
    features: [
      'dashboard',
      'api_keys',
      'monitoring',
      'brain',
      'operator',
      'sso_ready',
      'audit_exports',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom enterprise ceiling — contact sales for contract billing.',
    monthlyPriceUsd: null,
    limits: {
      maxOrganizations: 1_000,
      maxProjectsPerOrg: 10_000,
      maxApiKeysPerProject: 500,
      monthlyRequests: 50_000_000,
      monthlyBrainRequests: 5_000_000,
      monthlyMonitoringRequests: 25_000_000,
      storageBytes: 10 * 1024 * 1024 * 1024 * 1024,
      bandwidthBytes: 50 * 1024 * 1024 * 1024 * 1024,
    },
    features: [
      'dashboard',
      'api_keys',
      'monitoring',
      'brain',
      'operator',
      'sso_ready',
      'audit_exports',
      'dedicated_support',
      'custom_contracts',
    ],
  },
};

export function listPlans(): PlanDefinition[] {
  return Object.values(PLAN_CATALOG);
}

export function getPlan(planId: PlanId): PlanDefinition {
  const plan = PLAN_CATALOG[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  return plan;
}
