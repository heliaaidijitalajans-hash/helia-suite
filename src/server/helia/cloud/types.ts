/**
 * Helia Cloud domain types — multi-tenant customer gateway.
 */

export type PlanId = 'free' | 'starter' | 'professional' | 'business' | 'enterprise';

export type ProjectEnvironment = 'production' | 'development' | 'staging';

export type ApiKeyEnvironment = 'live' | 'test';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type UsageMetric =
  | 'requests'
  | 'errors'
  | 'brain_requests'
  | 'monitoring_requests'
  | 'storage_bytes'
  | 'bandwidth_bytes';

export interface CloudUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface CloudSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  lastUsedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  planId: PlanId;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  environment: ProjectEnvironment;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
}

export interface ApiKeyRecord {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  /** Prefix shown to humans, e.g. hl_live_ab12 */
  prefix: string;
  /** Environment encoded in key: live | test */
  keyEnvironment: ApiKeyEnvironment;
  /** HMAC hash of full secret — never store plaintext after creation. */
  secretHash: string;
  /** Last 4 chars for identification */
  lastFour: string;
  enabled: boolean;
  expiresAt?: string;
  createdAt: string;
  createdByUserId: string;
  rotatedFromId?: string;
  disabledAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  /**
   * Permission verbs: read | write | execute | admin
   * Legacy keys may still contain `*`.
   */
  permissions: string[];
  /** Application surface this key is issued for (optional on legacy keys). */
  applicationType?: string;
  /** Capability grants (optional on legacy keys; `*` permissions imply full set). */
  capabilities?: string[];
}

export interface SubscriptionRecord {
  id: string;
  organizationId: string;
  planId: PlanId;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  /** Billing provider placeholder — architecture only */
  billingProvider: 'none';
  externalCustomerId?: string;
  externalSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageBucket {
  id: string;
  organizationId: string;
  projectId: string;
  /** YYYY-MM */
  month: string;
  requests: number;
  errors: number;
  brainRequests: number;
  monitoringRequests: number;
  storageBytes: number;
  bandwidthBytes: number;
  updatedAt: string;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  monthlyPriceUsd: number | null;
  limits: {
    maxOrganizations: number;
    maxProjectsPerOrg: number;
    maxApiKeysPerProject: number;
    monthlyRequests: number;
    monthlyBrainRequests: number;
    monthlyMonitoringRequests: number;
    storageBytes: number;
    bandwidthBytes: number;
  };
  features: string[];
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  typ: 'access';
  sid: string;
}

export interface ApiKeyAuthContext {
  apiKey: ApiKeyRecord;
  organization: Organization;
  project: Project;
  subscription: SubscriptionRecord;
  plan: PlanDefinition;
  usage: UsageBucket;
}
