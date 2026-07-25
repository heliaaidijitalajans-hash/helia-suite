/**
 * Admin API — catalog for API Tester / Explorer.
 * Uses build-time api-manifest.json (bundled) with optional live FS scan.
 */

import { jsonError, jsonOk, requireAdminUser } from "@/server/helia/http";
import { discoverApiRoutesWithDebug } from "@/server/helia/api-catalog/discover";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const { routes, debug } = discoverApiRoutesWithDebug();
    const groups = [...new Set(routes.map((r) => r.group))].sort();

    console.log("[api-catalog/route] Search root:", debug.searchRoot);
    console.log("[api-catalog/route] Files found:", debug.filesFound.length);
    console.log("[api-catalog/route] Routes generated:", debug.routesGenerated);
    console.log("[api-catalog/route] Manifest loaded:", debug.manifestLoaded);
    console.log("[api-catalog/route] Endpoint count:", debug.endpointCount);

    return jsonOk({
      generatedAt: new Date().toISOString(),
      count: routes.length,
      groups,
      routes,
      debug,
    });
  } catch (error) {
    return jsonError(error);
  }
}
