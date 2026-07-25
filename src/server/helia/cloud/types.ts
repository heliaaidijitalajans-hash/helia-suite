/**
 * Helia Cloud domain types — multi-tenant customer gateway.
 */

export type PlanId = 'free' | 'starter' | 'professional' | 'business' | 'enterprise';

export type ProjectEnvironment = 'production' | 'development' | 'staging';

export type ApiKeyEnvironment = 'live' | 'test';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

/** Platform-level role — gates Helia Suite Admin Panel (`/admin`). */
export type PlatformRole = 'user' | 'admin';

export type OrganizationStatus = 'active' | 'suspended';

export type AuditLogLevel = 'info' | 'warning' | 'error';

export type AuditLogCategory =
  | 'auth'
  | 'api'
  | 'request'
  | 'application'
  | 'admin'
  | 'system';

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
  /** Defaults to `user` for legacy records. */
  role?: PlatformRole;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  /** When set, login and API session use are rejected. */
  disabledAt?: string;
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
  /** Defaults to `active` for legacy records. */
  status?: OrganizationStatus;
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
  role: PlatformRole;
  createdAt: string;
  lastLoginAt?: string;
  disabledAt?: string;
}

export interface AuditLogRecord {
  id: string;
  level: AuditLogLevel;
  category: AuditLogCategory;
  message: string;
  actorUserId?: string;
  organizationId?: string;
  projectId?: string;
  apiKeyId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminSettingsRecord {
  id: 'system';
  systemName: string;
  supportEmail: string;
  jwtAccessTtlSeconds: number;
  rateLimitMax: number;
  requireEmailVerification: boolean;
  brandingAccent: string;
  monthlyRequestSoftLimit: number;
  updatedAt: string;
  updatedByUserId?: string;
}

/** Helia Admin Chat conversation (Cloud-persisted). */
export interface BrainConversationRecord {
  id: string;
  userId: string;
  organizationId: string;
  projectId: string;
  title: string;
  preview?: string;
  createdAt: string;
  updatedAt: string;
  product?: 'helia-suite' | 'snapsell' | 'crm' | 'erp' | 'mobile';
}

/** Helia Admin Chat message (Cloud-persisted). */
export interface BrainMessageRecord {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  /** ISO timestamp */
  timestamp: string;
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
  role: PlatformRole;
}

export interface ApiKeyAuthContext {
  apiKey: ApiKeyRecord;
  organization: Organization;
  project: Project;
  subscription: SubscriptionRecord;
  plan: PlanDefinition;
  usage: UsageBucket;
}
