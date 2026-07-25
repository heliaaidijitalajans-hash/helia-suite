/**
 * Client-side catalog loader for API Explorer.
 * Tries admin catalog API, then public /api-manifest.json fallback.
 */

import { adminFetch } from "@/services/admin/http";
import type { CatalogRoute } from "@/components/admin/api-tester/types";

export type CatalogDebug = {
  searchRoot: string;
  filesFound: string[];
  routesGenerated: number;
  endpointCount: number;
  manifestLoaded: boolean;
  manifestGeneratedAt: string | null;
  source: string;
  error: string | null;
};

export type LoadedCatalog = {
  routes: CatalogRoute[];
  debug: CatalogDebug;
};

type PublicManifest = {
  generatedAt?: string;
  searchRoot?: string;
  filesFound?: string[];
  routeCount?: number;
  endpointCount?: number;
  routes?: CatalogRoute[];
  endpoints?: Array<{ method: string; path: string; category: string }>;
};

function emptyDebug(error: string): CatalogDebug {
  return {
    searchRoot: "src/app/api",
    filesFound: [],
    routesGenerated: 0,
    endpointCount: 0,
    manifestLoaded: false,
    manifestGeneratedAt: null,
    source: "none",
    error,
  };
}

async function loadPublicManifest(): Promise<LoadedCatalog> {
  const res = await fetch("/api-manifest.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Failed to load /api-manifest.json (HTTP ${res.status}). Run: npm run generate:api-manifest`
    );
  }
  const data = (await res.json()) as PublicManifest;
  const routes = Array.isArray(data.routes) ? data.routes : [];
  const endpointCount =
    data.endpointCount ||
    routes.reduce((n, r) => n + (r.methods?.length || 0), 0);

  if (routes.length === 0) {
    return {
      routes: [],
      debug: {
        searchRoot: data.searchRoot || "src/app/api",
        filesFound: data.filesFound || [],
        routesGenerated: 0,
        endpointCount: 0,
        manifestLoaded: true,
        manifestGeneratedAt: data.generatedAt || null,
        source: "public-manifest",
        error:
          "public/api-manifest.json loaded but contains 0 routes. Re-run npm run generate:api-manifest.",
      },
    };
  }

  return {
    routes,
    debug: {
      searchRoot: data.searchRoot || "src/app/api",
      filesFound: data.filesFound || routes.map((r) => r.file),
      routesGenerated: routes.length,
      endpointCount,
      manifestLoaded: true,
      manifestGeneratedAt: data.generatedAt || null,
      source: "public-manifest",
      error: null,
    },
  };
}

export async function loadApiCatalog(): Promise<LoadedCatalog> {
  const errors: string[] = [];

  try {
    const res = await adminFetch<{
      routes: CatalogRoute[];
      count: number;
      debug?: CatalogDebug;
    }>("/api/admin/tester/catalog");

    const routes = res.routes || [];
    if (routes.length > 0) {
      return {
        routes,
        debug: res.debug || {
          searchRoot: "src/app/api",
          filesFound: routes.map((r) => r.file),
          routesGenerated: routes.length,
          endpointCount: routes.reduce((n, r) => n + r.methods.length, 0),
          manifestLoaded: true,
          manifestGeneratedAt: null,
          source: "admin-catalog",
          error: null,
        },
      };
    }
    errors.push(
      res.debug?.error ||
        "Admin catalog API returned 0 routes."
    );
  } catch (err) {
    errors.push(
      err instanceof Error
        ? `Admin catalog: ${err.message}`
        : "Admin catalog request failed"
    );
  }

  try {
    const pub = await loadPublicManifest();
    if (pub.routes.length > 0) {
      return {
        ...pub,
        debug: {
          ...pub.debug,
          error: errors.length
            ? `${errors.join(" | ")} · Recovered via /api-manifest.json`
            : pub.debug.error,
        },
      };
    }
    errors.push(pub.debug.error || "Public manifest has 0 routes.");
  } catch (err) {
    errors.push(
      err instanceof Error
        ? `Public manifest: ${err.message}`
        : "Public manifest failed"
    );
  }

  return {
    routes: [],
    debug: emptyDebug(
      [
        "Endpoint discovery failed.",
        ...errors,
        "Diagnostics: ensure npm run generate:api-manifest ran (automatic on npm run dev).",
        "Expected files: public/api-manifest.json and src/server/helia/api-catalog/api-manifest.generated.ts",
      ].join(" ")
    ),
  };
}
