/**
 * Admin API — live discovery catalog for API Tester / Explorer.
 * Scans src/app/api at request time (no hardcoded endpoint lists).
 */

import { jsonError, jsonOk, requireAdminUser } from "@/server/helia/http";
import { discoverApiRoutes } from "@/server/helia/api-catalog/discover";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const routes = discoverApiRoutes();
    const groups = [...new Set(routes.map((r) => r.group))].sort();
    return jsonOk({
      generatedAt: new Date().toISOString(),
      count: routes.length,
      groups,
      routes,
    });
  } catch (error) {
    return jsonError(error);
  }
}
