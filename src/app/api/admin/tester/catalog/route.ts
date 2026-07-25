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

    if (process.env.NODE_ENV === "development" && debug.error) {
      console.error("[api-catalog/route]", debug.error);
    }

    // Do not expose source file paths to the client.
    const safeRoutes = routes.map((route) => {
      const { file, ...rest } = route;
      void file;
      return rest;
    });
    const safeDebug = {
      ...debug,
      filesFound: [] as string[],
      searchRoot: "src/app/api",
    };

    return jsonOk({
      generatedAt: new Date().toISOString(),
      count: routes.length,
      groups,
      routes: safeRoutes,
      debug: safeDebug,
    });
  } catch (error) {
    return jsonError(error);
  }
}
