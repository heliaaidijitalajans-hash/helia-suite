import {
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminUser,
} from "@/server/helia/http";
import { ValidationError } from "@/server/helia/utils/errors";

export const runtime = "nodejs";

const ALLOWED_PATHS = new Set([
  "/api/apikeys/whoami",
  "/api/organizations/plans",
]);

/**
 * Execute a same-origin API request with a pasted API key.
 * Tracks real usage via gateway when hitting whoami.
 */
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
    const path = body.path?.trim() || "/api/apikeys/whoami";

    if (!apiKey) throw new ValidationError("API key is required");
    if (!["GET", "POST", "DELETE"].includes(method)) {
      throw new ValidationError("Method must be GET, POST, or DELETE");
    }
    if (!path.startsWith("/api/")) {
      throw new ValidationError("Path must start with /api/");
    }
    if (!ALLOWED_PATHS.has(path) && path !== "/api/apikeys/whoami") {
      // Allow whoami always; other /api paths only if explicitly listed for safety
      if (!path.startsWith("/api/apikeys/whoami")) {
        // Restrict to known safe gateway endpoints to avoid SSRF-like loops
        const safe =
          path === "/api/apikeys/whoami" ||
          path === "/api/organizations/plans";
        if (!safe) {
          throw new ValidationError(
            "Endpoint not allowed in Admin API Tester. Use /api/apikeys/whoami or /api/organizations/plans."
          );
        }
      }
    }

    const origin = new URL(request.url).origin;
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(body.headers ?? {}),
    };

    let payload: string | undefined;
    if (method !== "GET" && body.jsonBody !== undefined) {
      headers["Content-Type"] = "application/json";
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
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    return jsonOk({
      status: res.status,
      latencyMs,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries()),
      body: json ?? text,
      executedAt: new Date().toISOString(),
      request: { method, path },
    });
  } catch (error) {
    return jsonError(error);
  }
}
