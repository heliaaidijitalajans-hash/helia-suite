import { GENERATED_ENDPOINTS } from "./generated-endpoints";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type EndpointDef = {
  method: HttpMethod;
  path: string;
  group: string;
  label?: string;
};

export type QueryParam = { id: string; key: string; value: string; enabled: boolean };

export type HistoryEntry = {
  id: string;
  at: string;
  method: HttpMethod;
  path: string;
  pathTemplate: string;
  query: QueryParam[];
  headersText: string;
  bodyText: string;
  status: number;
  latencyMs: number;
  sizeBytes: number;
};

export type ValidateResult = {
  valid: boolean;
  organization: { id: string; name: string; planId: string; status?: string };
  project: { id: string; name: string; environment: string };
  application: {
    id: string;
    name: string;
    permissions: string[];
    capabilities: string[];
    usageCount: number;
    lastUsedAt: string | null;
    prefix?: string;
    lastFour?: string;
    enabled?: boolean;
  };
  plan: { id?: string; name?: string; limits: Record<string, number> };
  usage: Record<string, unknown>;
  rateLimits: { windowMs: number; max: number };
};

export type ExecuteResult = {
  status: number;
  latencyMs: number;
  sizeBytes: number;
  ok: boolean;
  body: unknown;
  rawText?: string;
  executedAt: string;
  request: { method: string; path: string };
};

export const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

/** Real App Router endpoints only — regenerated via `node scripts/generate-api-tester-endpoints.mjs`. */
export const PREDEFINED_ENDPOINTS: EndpointDef[] = GENERATED_ENDPOINTS;

export function endpointKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export function buildUrlWithQuery(
  path: string,
  query: QueryParam[]
): string {
  const base = path.trim() || "/";
  const [pathname, existing] = base.split("?");
  const params = new URLSearchParams(existing || "");
  for (const q of query) {
    if (!q.enabled || !q.key.trim()) continue;
    params.set(q.key.trim(), q.value);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname || "/";
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function prettyJson(value: unknown): string {
  try {
    if (typeof value === "string") {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}
