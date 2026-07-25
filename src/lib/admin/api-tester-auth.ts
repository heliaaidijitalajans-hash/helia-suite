/**
 * Shared API Tester auth helpers — used by the client Request Builder
 * and the admin execute proxy so header construction stays identical.
 */

export type AuthMode = "bearer" | "x-api-key" | "both";

export type AuthCompatibility =
  | { compatible: true; warning: string | null }
  | { compatible: false; warning: string };

/**
 * Normalize pasted secrets: trim and strip a duplicated "Bearer " prefix
 * so Authorization never becomes "Bearer Bearer hl_…".
 */
export function normalizeApiKeyInput(raw: string): string {
  let key = raw.trim();
  if (/^Bearer\s+/i.test(key)) {
    key = key.replace(/^Bearer\s+/i, "").trim();
  }
  return key;
}

/**
 * whoami (and other api_key routes) only read Authorization: Bearer.
 * X-API-Key-only mode would 401 even with a valid key — upgrade to both.
 */
export function resolveAuthModeForRoute(
  authMode: AuthMode,
  routeAuth?: string | null
): AuthMode {
  if (routeAuth === "api_key" && authMode === "x-api-key") {
    return "both";
  }
  return authMode;
}

/**
 * Guard Run against auth modes that cannot succeed for the selected endpoint.
 * Does not change how auth headers are built — only blocks doomed requests.
 */
export function getAuthCompatibility(
  routeAuth: string | null | undefined,
  hasApiKey: boolean
): AuthCompatibility {
  if (routeAuth === "public") {
    return { compatible: true, warning: "This endpoint is public." };
  }
  if (routeAuth === "session" || routeAuth === "admin_session") {
    return {
      compatible: false,
      warning: "This endpoint requires Bearer authentication.",
    };
  }
  if (routeAuth === "api_key") {
    if (!hasApiKey) {
      return {
        compatible: false,
        warning: "This endpoint requires an API Key.",
      };
    }
    return { compatible: true, warning: null };
  }
  return { compatible: true, warning: null };
}

/** Strip conflicting auth keys (any casing). */
export function stripAuthHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const lower = k.toLowerCase();
    if (lower === "authorization" || lower === "x-api-key") continue;
    out[k] = v;
  }
  return out;
}

/**
 * Build final upstream headers from custom JSON + API key + auth mode.
 * Selected auth headers always win over manual header editor values.
 */
export function buildAuthenticatedHeaders(opts: {
  apiKey: string;
  authMode: AuthMode;
  customHeaders?: Record<string, string>;
  includeContentTypeJson?: boolean;
}): {
  headers: Record<string, string>;
  authHeadersApplied: Record<string, string>;
  authAppliedLabels: string[];
} {
  const key = normalizeApiKeyInput(opts.apiKey);
  const base = stripAuthHeaders({
    Accept: "application/json",
    ...(opts.customHeaders ?? {}),
  });

  if (
    opts.includeContentTypeJson &&
    !base["Content-Type"] &&
    !base["content-type"]
  ) {
    base["Content-Type"] = "application/json";
  }

  const authHeadersApplied: Record<string, string> = {};
  const authAppliedLabels: string[] = [];
  if (key) {
    if (opts.authMode === "bearer" || opts.authMode === "both") {
      base.Authorization = `Bearer ${key}`;
      authHeadersApplied.Authorization = `Bearer ${key}`;
      authAppliedLabels.push("Authorization: Bearer");
    }
    if (opts.authMode === "x-api-key" || opts.authMode === "both") {
      base["X-API-Key"] = key;
      authHeadersApplied["X-API-Key"] = key;
      authAppliedLabels.push("X-API-Key");
    }
  }

  return { headers: base, authHeadersApplied, authAppliedLabels };
}

/** Redact secrets for UI display while proving which headers were present. */
export function redactHeadersForDisplay(
  headers: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const lower = k.toLowerCase();
    if (lower === "authorization") {
      const m = v.match(/^(Bearer)\s+(\S+)$/i);
      if (m) {
        const token = m[2];
        const hint =
          token.length <= 12
            ? "***"
            : `${token.slice(0, 8)}…${token.slice(-4)}`;
        out[k] = `${m[1]} ${hint}`;
      } else {
        out[k] = "***";
      }
      continue;
    }
    if (lower === "x-api-key") {
      out[k] = v.length <= 12 ? "***" : `${v.slice(0, 8)}…${v.slice(-4)}`;
      continue;
    }
    out[k] = v;
  }
  return out;
}

/** Placeholder used in exported code samples — never the real secret. */
export function apiKeyExportPlaceholder(apiKey?: string): string {
  const key = normalizeApiKeyInput(apiKey ?? "");
  if (key.startsWith("hl_test_")) return "hl_test_YOUR_API_KEY";
  return "YOUR_API_KEY";
}

/**
 * Replace real API keys in headers before codegen.
 * Authorization Bearer and X-API-Key become export placeholders.
 */
export function sanitizeHeadersForCodeExport(
  headers: Record<string, string>,
  apiKey?: string
): Record<string, string> {
  const placeholder = apiKeyExportPlaceholder(apiKey);
  const key = normalizeApiKeyInput(apiKey ?? "");
  const out: Record<string, string> = {};

  for (const [k, v] of Object.entries(headers)) {
    const lower = k.toLowerCase();
    if (lower === "authorization") {
      const m = v.match(/^(Bearer)\s+(\S+)$/i);
      if (m) {
        out[k] = `${m[1]} ${placeholder}`;
      } else if (key && v.includes(key)) {
        out[k] = v.split(key).join(placeholder);
      } else {
        out[k] = `Bearer ${placeholder}`;
      }
      continue;
    }
    if (lower === "x-api-key") {
      out[k] = placeholder;
      continue;
    }
    if (key && v.includes(key)) {
      out[k] = v.split(key).join(placeholder);
      continue;
    }
    out[k] = v;
  }
  return out;
}
