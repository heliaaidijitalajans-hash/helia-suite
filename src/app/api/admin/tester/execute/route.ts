/**
 * Admin API Tester — execute same-origin /api/* requests with a pasted customer key.
 * Path is restricted to this deployment origin (no open SSRF).
 * Unknown paths return "This endpoint is not implemented." without calling upstream.
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

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const body = await readJsonBody<{
      apiKey?: string;
      method?: string;
      path?: string;
      headers?: Record<string, string>;
      jsonBody?: unknown;
    }>(request);

    const apiKey = body.apiKey?.trim();
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
        request: { method, path },
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
        request: { method, path },
      });
    }

    const origin = new URL(request.url).origin;
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(body.headers ?? {}),
    };

    if (!headers["X-API-Key"] && !headers["x-api-key"]) {
      headers["X-API-Key"] = apiKey;
    }

    let payload: string | undefined;
    if (method !== "GET" && method !== "DELETE" && body.jsonBody !== undefined) {
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
      payload = JSON.stringify(body.jsonBody);
    }

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

    return jsonOk({
      status: res.status,
      latencyMs,
      sizeBytes,
      upstreamOk: res.ok,
      implemented: true,
      headers: Object.fromEntries(res.headers.entries()),
      body: json ?? text,
      rawText: text,
      executedAt: new Date().toISOString(),
      request: { method, path },
      route: {
        path: matched.path,
        file: matched.file,
        authentication: matched.authentication,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
