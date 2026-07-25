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
import {
  buildAuthenticatedHeaders,
  getAuthCompatibility,
  normalizeApiKeyInput,
  redactHeadersForDisplay,
  resolveAuthModeForRoute,
  type AuthMode,
} from "@/lib/admin/api-tester-auth";

export const runtime = "nodejs";

const ALLOWED_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

/** Protect execute proxy from abusive / accidental oversized traffic. */
const MAX_REQUEST_BODY_BYTES = 1_000_000; // 1 MB
const MAX_RESPONSE_BYTES = 2_000_000; // 2 MB
const EXECUTE_TIMEOUT_MS = 30_000;

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

async function readResponseLimited(
  res: Response,
  maxBytes: number
): Promise<{ text: string; sizeBytes: number; truncated: boolean }> {
  const contentLength = res.headers.get("content-length");
  if (contentLength) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new ValidationError(
        `Upstream response exceeds the ${Math.round(maxBytes / 1_000_000)} MB limit (${declared} bytes).`
      );
    }
  }

  if (!res.body) {
    return { text: "", sizeBytes: 0, truncated: false };
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let sizeBytes = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    sizeBytes += value.byteLength;
    if (sizeBytes > maxBytes) {
      truncated = true;
      const overflow = sizeBytes - maxBytes;
      const keep = value.byteLength - overflow;
      if (keep > 0) chunks.push(value.subarray(0, keep));
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      break;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(
    chunks.reduce((n, c) => n + c.byteLength, 0)
  );
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  const text = new TextDecoder().decode(merged);
  return { text, sizeBytes: truncated ? sizeBytes : merged.byteLength, truncated };
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

    const apiKey = normalizeApiKeyInput(body.apiKey ?? "");
    let authMode: AuthMode =
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
    authMode = resolveAuthModeForRoute(authMode, matched?.authentication);

    const authCompat = getAuthCompatibility(
      matched?.authentication,
      Boolean(apiKey)
    );
    if (!authCompat.compatible) {
      throw new ValidationError(authCompat.warning);
    }

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

    const { headers, authAppliedLabels } = buildAuthenticatedHeaders({
      apiKey,
      authMode,
      customHeaders: body.headers,
      includeContentTypeJson: withJsonBody,
    });

    let payload: string | undefined;
    if (withJsonBody) {
      payload = JSON.stringify(body.jsonBody);
      const payloadBytes = new TextEncoder().encode(payload).byteLength;
      if (payloadBytes > MAX_REQUEST_BODY_BYTES) {
        throw new ValidationError(
          `Request body exceeds the ${Math.round(MAX_REQUEST_BODY_BYTES / 1_000_000)} MB limit (${payloadBytes} bytes).`
        );
      }
    }

    const origin = new URL(request.url).origin;
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXECUTE_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${origin}${path}`, {
        method,
        headers,
        body: payload,
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "AbortError" || /aborted/i.test(err.message))
      ) {
        throw new ValidationError(
          `Request timed out after ${EXECUTE_TIMEOUT_MS / 1000}s.`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const latencyMs = Date.now() - started;
    const {
      text,
      sizeBytes,
      truncated,
    } = await readResponseLimited(res, MAX_RESPONSE_BYTES);

    if (truncated) {
      throw new ValidationError(
        `Upstream response exceeds the ${Math.round(MAX_RESPONSE_BYTES / 1_000_000)} MB preview limit. Narrow the request or call the endpoint directly.`
      );
    }

    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    const requestHeadersDisplay = redactHeadersForDisplay(headers);

    return jsonOk({
      status: res.status,
      latencyMs,
      sizeBytes,
      upstreamOk: res.ok,
      implemented: true,
      headers: Object.fromEntries(res.headers.entries()),
      requestHeaders: requestHeadersDisplay,
      authHeadersApplied: authAppliedLabels,
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
        authentication: matched.authentication,
      },
      ...(res.status === 401
        ? {
            authDebug: {
              message:
                "401 Unauthorized — authentication headers that were sent:",
              authHeadersApplied: authAppliedLabels,
              requestHeaders: requestHeadersDisplay,
            },
          }
        : {}),
    });
  } catch (error) {
    return jsonError(error);
  }
}
