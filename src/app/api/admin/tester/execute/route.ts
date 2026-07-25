/**
 * Admin API Tester — execute same-origin /api/* requests with a pasted customer key.
 * Path is restricted to this deployment origin (no open SSRF).
 */

import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";
import { ValidationError } from "@/server/helia/utils/errors";

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
  // Reject protocol-relative / absolute URLs
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

    if (!apiKey) throw new ValidationError("API key is required");
    if (!ALLOWED_METHODS.has(method)) {
      throw new ValidationError(
        "Method must be GET, POST, PUT, PATCH, or DELETE"
      );
    }

    const origin = new URL(request.url).origin;
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(body.headers ?? {}),
    };

    // Prefer explicit X-API-Key if provided; keep Bearer for gateway compatibility
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

    // Do NOT set top-level `ok` to the upstream result — jsonOk already sets
    // envelope `ok: true` when this proxy itself succeeded. Overwriting it with
    // upstream `res.ok === false` made adminFetch throw "Request failed (200)".
    return jsonOk({
      status: res.status,
      latencyMs,
      sizeBytes,
      upstreamOk: res.ok,
      headers: Object.fromEntries(res.headers.entries()),
      body: json ?? text,
      rawText: text,
      executedAt: new Date().toISOString(),
      request: { method, path },
    });
  } catch (error) {
    return jsonError(error);
  }
}
