export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type AuthType =
  | "api_key"
  | "session"
  | "admin_session"
  | "public"
  | "mixed"
  | "unknown";

/** Live catalog entry from /api/admin/tester/catalog (filesystem discovery). */
export type CatalogRoute = {
  path: string;
  methods: HttpMethod[];
  group: string;
  /** Omitted from public / client-facing catalog responses. */
  file?: string;
  description: string | null;
  authentication: AuthType;
  permissions: string[];
  queryParameters: string[];
  pathParameters: string[];
  bodyFields: string[];
  bodySchemaHint: string | null;
  multipart: boolean;
  apiKeySupported: boolean;
  sessionRequired: boolean;
};

export type CatalogResponse = {
  ok: true;
  generatedAt: string;
  count: number;
  groups: string[];
  routes: CatalogRoute[];
};

export type QueryParam = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export type PathParam = { id: string; key: string; value: string };

export type HistoryEntry = {
  id: string;
  at: string;
  method: HttpMethod;
  path: string;
  pathTemplate: string;
  query: QueryParam[];
  pathParams: PathParam[];
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
  upstreamOk: boolean;
  implemented?: boolean;
  message?: string;
  body: unknown;
  rawText?: string;
  executedAt: string;
  request: {
    method: string;
    path: string;
    authMode?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  requestHeaders?: Record<string, string>;
  authHeadersApplied?: string[];
  authMode?: string;
  authDebug?: {
    message: string;
    authHeadersApplied: string[];
    requestHeaders: Record<string, string>;
  };
  headers?: Record<string, string>;
};

export function bodyReportsFailure(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  return (body as { ok?: unknown }).ok === false;
}

export function bodyReportsSuccess(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  return (body as { ok?: unknown }).ok === true;
}

export const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

export function endpointKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export function applyPathParams(
  template: string,
  params: PathParam[]
): string {
  const map = Object.fromEntries(
    params.map((p) => [p.key, p.value.trim()])
  );
  return template.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, key: string) => {
    const v = map[key];
    return v ? encodeURIComponent(v) : `:${key}`;
  });
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

/** Soft cap for on-screen JSON preview to avoid freezing the tab. */
export const RESPONSE_PREVIEW_MAX_CHARS = 200_000;

export function truncateForPreview(
  text: string,
  maxChars = RESPONSE_PREVIEW_MAX_CHARS
): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  return {
    text:
      text.slice(0, maxChars) +
      "\n\n… truncated for preview — use Download JSON for the complete response.",
    truncated: true,
  };
}

export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export function matchCatalogRoute(
  routes: CatalogRoute[],
  requestPath: string
): CatalogRoute | null {
  const pathOnly = (requestPath.split("?")[0] || "").trim();
  const exact = routes.find((r) => r.path === pathOnly);
  if (exact) return exact;
  for (const r of routes) {
    if (!r.path.includes(":")) continue;
    const pattern = new RegExp(
      "^" +
        r.path
          .split("/")
          .map((seg) =>
            seg.startsWith(":")
              ? "[^/]+"
              : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          )
          .join("/") +
        "$"
    );
    if (pattern.test(pathOnly)) return r;
  }
  return null;
}
