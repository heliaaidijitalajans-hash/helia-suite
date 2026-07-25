export type AuthMode = "bearer" | "x-api-key" | "both";

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
  if (key) {
    if (opts.authMode === "bearer" || opts.authMode === "both") {
      base.Authorization = `Bearer ${key}`;
      authHeadersApplied.Authorization = `Bearer ${key}`;
    }
    if (opts.authMode === "x-api-key" || opts.authMode === "both") {
      base["X-API-Key"] = key;
      authHeadersApplied["X-API-Key"] = key;
    }
  }

  return { headers: base, authHeadersApplied };
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
      out[k] =
        v.length <= 12 ? "***" : `${v.slice(0, 8)}…${v.slice(-4)}`;
      continue;
    }
    out[k] = v;
  }
  return out;
}
