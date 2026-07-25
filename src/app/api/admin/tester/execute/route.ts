/**
 * Admin API Tester — execute same-origin /api/* with pasted customer API key.
 * Auth headers are applied server-side from apiKey + authMode (not left to manual JSON).
 */

import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";
import { ValidationError } from "@/server/helia/utils/errors";
import {
  discoverApiRoutes,
  findRouteInCatalog,
} from "@/server/helia/api-catalog/discover";

export const runtime = "nodejs";

const ALLOWED_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

type AuthMode = "bearer" | "x-api-key" | "both";

function normalizePath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) {
    throw new ValidationError("Path must start with /");
  }
  if (trimmed.startsWith("//") || /^https?:/i.test(trimmed)) {
    throw new ValidationError("Absolute URLs are not allowed");
  }
  const pathOnly = trimmed.split("?")[0] || trimmed;
  if (!pathOnly.startsWith("/api/")) {
    throw new ValidationError("Path must start with /api/");
  }
  if (pathOnly.includes("..")) {
    throw new ValidationError("Invalid path");
  }
  return trimmed;
}

function stripAuthHeaders(
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

function redact(headers: Record<string, string>): Record<string, string> {
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
      } else out[k] = "***";
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

function buildUpstreamHeaders(opts: {
  apiKey: string;
  authMode: AuthMode;
  custom?: Record<string, string>;
  withJsonBody: boolean;
}): { headers: Record<string, string>; authApplied: string[] } {
  const headers = stripAuthHeaders({
    Accept: "application/json",
    ...(opts.custom ?? {}),
  });
  if (
    opts.withJsonBody &&
    !headers["Content-Type"] &&
    !headers["content-type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const authApplied: string[] = [];
  const key = opts.apiKey;
  if (opts.authMode === "bearer" || opts.authMode === "both") {
    headers.Authorization = `Bearer ${key}`;
    authApplied.push("Authorization: Bearer");
  }
  if (opts.authMode === "x-api-key" || opts.authMode === "both") {
    headers["X-API-Key"] = key;
    authApplied.push("X-API-Key");
  }
  return { headers, authApplied };
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const body = await readJsonBody<{
      apiKey?: string;
      authMode?: AuthMode;
      method?: string;
      path?: string;
      headers?: Record<string, string>;
      jsonBody?: unknown;
    }>(request);

    const apiKey = body.apiKey?.trim();
    const authMode: AuthMode =
      body.authMode === "bearer" || body.authMode === "x-api-key"
        ? body.authMode
        : "both";
    const method = (body.method ?? "GET").toUpperCase();
    const path = normalizePath(body.path?.trim() || "/api/apikeys/whoami");
    const pathOnly = path.split("?")[0] || path;

    if (!apiKey) throw new ValidationError("API key is required");
    if (!ALLOWED_METHODS.has(method)) {
      throw new ValidationError(
        "Method must be GET, POST, PUT, PATCH, or DELETE"
      );
    }

    const catalog = discoverApiRoutes();
    const matched = findRouteInCatalog(catalog, pathOnly);
    if (!matched) {
      return jsonOk({
        status: 404,
        latencyMs: 0,
        sizeBytes: 0,
        upstreamOk: false,
        implemented: false,
        message: "This endpoint is not implemented.",
        headers: {},
        requestHeaders: {},
        authHeadersApplied: [],
        body: {
          ok: false,
          error: {
            code: "NOT_IMPLEMENTED",
            message: "This endpoint is not implemented.",
            path: pathOnly,
          },
        },
        rawText: "",
        executedAt: new Date().toISOString(),
        request: { method, path, authMode },
      });
    }

    const methodAllowed = matched.methods.includes(
      method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
    );
    if (!methodAllowed) {
      return jsonOk({
        status: 405,
        latencyMs: 0,
        sizeBytes: 0,
        upstreamOk: false,
        implemented: true,
        message: `Method ${method} is not supported for ${matched.path}. Allowed: ${matched.methods.join(", ")}`,
        headers: {},
        requestHeaders: {},
        authHeadersApplied: [],
        body: {
          ok: false,
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: `Method ${method} is not supported for this endpoint.`,
            allowed: matched.methods,
          },
        },
        rawText: "",
        executedAt: new Date().toISOString(),
        request: { method, path, authMode },
      });
    }

    const withJsonBody =
      method !== "GET" &&
      method !== "DELETE" &&
      body.jsonBody !== undefined;

    const { headers, authApplied } = buildUpstreamHeaders({
      apiKey,
      authMode,
      custom: body.headers,
      withJsonBody,
    });

    let payload: string | undefined;
    if (withJsonBody) {
      payload = JSON.stringify(body.jsonBody);
    }

    const origin = new URL(request.url).origin;
    const started = Date.now();
    const res = await fetch(`${origin}${path}`, {
      method,
      headers,
      body: payload,
      cache: "no-store",
    });
    const latencyMs = Date.now() - started;
    const text = await res.text();
    const sizeBytes = new TextEncoder().encode(text).length;
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    const requestHeadersDisplay = redact(headers);

    return jsonOk({
      status: res.status,
      latencyMs,
      sizeBytes,
      upstreamOk: res.ok,
      implemented: true,
      headers: Object.fromEntries(res.headers.entries()),
      requestHeaders: requestHeadersDisplay,
      authHeadersApplied: authApplied,
      authMode,
      body: json ?? text,
      rawText: text,
      executedAt: new Date().toISOString(),
      request: {
        method,
        path,
        authMode,
        headers: requestHeadersDisplay,
        body: withJsonBody ? body.jsonBody : undefined,
      },
      route: {
        path: matched.path,
        file: matched.file,
        authentication: matched.authentication,
      },
      ...(res.status === 401
        ? {
            authDebug: {
              message: "401 Unauthorized — authentication headers that were sent:",
              authHeadersApplied: authApplied,
              requestHeaders: requestHeadersDisplay,
            },
          }
        : {}),
    });
  } catch (error) {
    return jsonError(error);
  }
}
