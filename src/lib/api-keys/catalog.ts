/**
 * Extensible API Key capability / permission / application-type catalog.
 * Add new capabilities here only — callers use these enums/interfaces.
 */

export const API_CAPABILITIES = [
  "monitoring",
  "health",
  "incidents",
  "logs",
  "metrics",
  "reports",
  "brain",
  "chat",
  "knowledge",
  "decision_engine",
  "operator",
  "maintenance",
  "prediction",
  "timeline",
  "notifications",
  "realtime_events",
  "webhooks",
  "analytics",
  "storage_monitoring",
  "database_monitoring",
  "auth_monitoring",
  "ai_monitoring",
  "user_monitoring",
  "configuration",
] as const;

export type ApiCapability = (typeof API_CAPABILITIES)[number];

export const API_CAPABILITY_LABELS: Record<ApiCapability, string> = {
  monitoring: "Monitoring",
  health: "Health",
  incidents: "Incidents",
  logs: "Logs",
  metrics: "Metrics",
  reports: "Reports",
  brain: "Brain",
  chat: "Chat",
  knowledge: "Knowledge",
  decision_engine: "Decision Engine",
  operator: "Operator",
  maintenance: "Maintenance",
  prediction: "Prediction",
  timeline: "Timeline",
  notifications: "Notifications",
  realtime_events: "Realtime Events",
  webhooks: "Webhooks",
  analytics: "Analytics",
  storage_monitoring: "Storage Monitoring",
  database_monitoring: "Database Monitoring",
  auth_monitoring: "Auth Monitoring",
  ai_monitoring: "AI Monitoring",
  user_monitoring: "User Monitoring",
  configuration: "Configuration",
};

export const API_PERMISSIONS = ["read", "write", "execute", "admin"] as const;

export type ApiPermission = (typeof API_PERMISSIONS)[number];

export const API_PERMISSION_LABELS: Record<ApiPermission, string> = {
  read: "Read",
  write: "Write",
  execute: "Execute",
  admin: "Admin",
};

export const APPLICATION_TYPES = [
  "web",
  "mobile",
  "backend",
  "saas",
  "internal_platform",
] as const;

export type ApplicationType = (typeof APPLICATION_TYPES)[number];

/** UI-only display labels. Never send these to the API. */
export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  web: "Web",
  mobile: "Mobile",
  backend: "Backend",
  saas: "SaaS",
  internal_platform: "Internal Platform",
};

/** Select options: `value` is the backend enum, `label` is UI-only. */
export const APPLICATION_TYPE_OPTIONS: ReadonlyArray<{
  value: ApplicationType;
  label: string;
}> = APPLICATION_TYPES.map((value) => ({
  value,
  label: APPLICATION_TYPE_LABELS[value],
}));

/**
 * Display-label → enum aliases (legacy / mistaken payloads).
 * Canonical API values remain APPLICATION_TYPES only.
 */
const APPLICATION_TYPE_LABEL_ALIASES: Record<string, ApplicationType> = {
  Web: "web",
  Mobile: "mobile",
  Backend: "backend",
  SaaS: "saas",
  saas: "saas",
  "Internal Platform": "internal_platform",
  "internal platform": "internal_platform",
  InternalPlatform: "internal_platform",
  internalPlatform: "internal_platform",
  "internal-platform": "internal_platform",
};

export function isApiCapability(value: string): value is ApiCapability {
  return (API_CAPABILITIES as readonly string[]).includes(value);
}

export function isApiPermission(value: string): value is ApiPermission {
  return (API_PERMISSIONS as readonly string[]).includes(value);
}

export function isApplicationType(value: string): value is ApplicationType {
  return (APPLICATION_TYPES as readonly string[]).includes(value);
}

/**
 * Normalize any form/API input to a backend applicationType enum.
 * Accepts enum values; maps known UI labels; rejects everything else.
 */
export function toApplicationTypeEnum(value: string): ApplicationType {
  const trimmed = value.trim();
  if (isApplicationType(trimmed)) return trimmed;

  const aliased =
    APPLICATION_TYPE_LABEL_ALIASES[trimmed] ??
    APPLICATION_TYPE_LABEL_ALIASES[trimmed.toLowerCase()];
  if (aliased) return aliased;

  const byLabel = (
    Object.entries(APPLICATION_TYPE_LABELS) as Array<[ApplicationType, string]>
  ).find(([, label]) => label.toLowerCase() === trimmed.toLowerCase());
  if (byLabel) return byLabel[0];

  throw new Error(
    `Invalid applicationType "${value}". Expected one of: ${APPLICATION_TYPES.join(", ")}`
  );
}

export function isInternalPlatform(type: ApplicationType): boolean {
  return type === "internal_platform";
}

/** Internal Platform always receives every capability. */
export function resolveCapabilities(
  applicationType: ApplicationType,
  selected: readonly string[] = []
): ApiCapability[] {
  if (isInternalPlatform(applicationType)) {
    return [...API_CAPABILITIES];
  }
  const unique = new Set<ApiCapability>();
  for (const item of selected) {
    if (isApiCapability(item)) unique.add(item);
  }
  return [...unique];
}

export function resolvePermissions(
  selected: readonly string[] = [],
  applicationType?: ApplicationType
): ApiPermission[] {
  if (applicationType && isInternalPlatform(applicationType)) {
    return [...API_PERMISSIONS];
  }
  const unique = new Set<ApiPermission>();
  for (const item of selected) {
    if (item === "*") {
      return [...API_PERMISSIONS];
    }
    if (isApiPermission(item)) unique.add(item);
  }
  if (unique.size === 0) unique.add("read");
  return [...unique];
}

export function hasCapability(
  capabilities: readonly string[] | undefined,
  capability: ApiCapability,
  permissions?: readonly string[]
): boolean {
  if (permissions?.includes("*")) return true;
  if (!capabilities || capabilities.length === 0) {
    return Boolean(permissions?.includes("*"));
  }
  return capabilities.includes(capability);
}

export function hasPermission(
  permissions: readonly string[] | undefined,
  permission: ApiPermission
): boolean {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  if (permissions.includes("admin")) return true;
  return permissions.includes(permission);
}

export type ApiKeyAccessPolicy = {
  applicationType: ApplicationType;
  capabilities: ApiCapability[];
  permissions: ApiPermission[];
};

export function buildAccessPolicy(input: {
  applicationType?: string;
  capabilities?: readonly string[];
  permissions?: readonly string[];
}): ApiKeyAccessPolicy {
  const applicationType =
    input.applicationType && input.applicationType.trim()
      ? toApplicationTypeEnum(input.applicationType)
      : "backend";
  return {
    applicationType,
    capabilities: resolveCapabilities(
      applicationType,
      input.capabilities ?? []
    ),
    permissions: resolvePermissions(
      input.permissions ?? [],
      applicationType
    ),
  };
}
