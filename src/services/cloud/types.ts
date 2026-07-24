export type PlanId =
  | "free"
  | "starter"
  | "professional"
  | "business"
  | "enterprise";

export type ProjectEnvironment = "production" | "development" | "staging";

export type ApiKeyEnvironment = "live" | "test";

export type CloudOrganization = {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  planId: PlanId;
  createdAt: string;
  updatedAt: string;
};

export type CloudProject = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  environment: ProjectEnvironment;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
};

export type CloudApiKey = {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  prefix: string;
  keyEnvironment: ApiKeyEnvironment;
  lastFour: string;
  enabled: boolean;
  expiresAt?: string;
  createdAt: string;
  createdByUserId: string;
  rotatedFromId?: string;
  disabledAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  permissions: string[];
};

export type CloudPlan = {
  id: PlanId;
  name: string;
  description: string;
  monthlyPriceUsd: number | null;
  limits: Record<string, number>;
  features: string[];
};

export type CloudSubscription = {
  id: string;
  organizationId: string;
  planId: PlanId;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  billingProvider: string;
};

export type CloudUsageBucket = {
  id: string;
  organizationId: string;
  projectId: string;
  month: string;
  requests: number;
  errors: number;
  brainRequests: number;
  monitoringRequests: number;
  storageBytes: number;
  bandwidthBytes: number;
  updatedAt: string;
};

export type CloudUsageTotals = {
  requests: number;
  errors: number;
  brainRequests: number;
  monitoringRequests: number;
  storageBytes: number;
  bandwidthBytes: number;
};

export type CloudUsageResponse = {
  ok: true;
  month: string;
  buckets: CloudUsageBucket[];
  totals?: CloudUsageTotals;
  subscription?: CloudSubscription;
};
