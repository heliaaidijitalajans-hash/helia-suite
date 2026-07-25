/**
 * Client-side catalog loader for API Explorer.
 * Tries admin catalog API, then public /api-manifest.json fallback.
 */

import { adminFetch } from "@/services/admin/http";
import type {
  AuthType,
  CatalogRoute,
  HttpMethod,
} from "@/components/admin/api-tester/types";

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

type PublicEndpoint = {
  method: string;
  path: string;
  authentication?: string;
  category?: string;
};

type PublicManifest = {
  generatedAt?: string;
  endpointCount?: number;
  endpoints?: PublicEndpoint[];
  /** Legacy full-route shape (pre-hardening). */
  routes?: CatalogRoute[];
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

function pathParamsFromPath(urlPath: string): string[] {
  const out: string[] = [];
  for (const seg of urlPath.split("/")) {
    if (seg.startsWith(":")) out.push(seg.slice(1));
  }
  return out;
}

function routesFromPublicEndpoints(endpoints: PublicEndpoint[]): CatalogRoute[] {
  const byPath = new Map<string, CatalogRoute>();
  for (const e of endpoints) {
    if (!e?.path || !e?.method) continue;
    const method = e.method.toUpperCase() as HttpMethod;
    const auth = (e.authentication || "unknown") as AuthType;
    let route = byPath.get(e.path);
    if (!route) {
      route = {
        path: e.path,
        methods: [],
        group: e.category || "Other",
        description: null,
        authentication: auth,
        permissions: [],
        queryParameters: [],
        pathParameters: pathParamsFromPath(e.path),
        bodyFields: [],
        bodySchemaHint: null,
        multipart: false,
        apiKeySupported: auth === "api_key",
        sessionRequired: auth === "session" || auth === "admin_session",
      };
      byPath.set(e.path, route);
    }
    if (!route.methods.includes(method)) {
      route.methods.push(method);
    }
  }
  return [...byPath.values()].sort(
    (a, b) => a.group.localeCompare(b.group) || a.path.localeCompare(b.path)
  );
}

async function loadPublicManifest(): Promise<LoadedCatalog> {
  const res = await fetch("/api-manifest.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Failed to load /api-manifest.json (HTTP ${res.status}). Run: npm run generate:api-manifest`
    );
  }
  const data = (await res.json()) as PublicManifest;

  let routes: CatalogRoute[] = [];
  if (Array.isArray(data.endpoints) && data.endpoints.length > 0) {
    routes = routesFromPublicEndpoints(data.endpoints);
  } else if (Array.isArray(data.routes)) {
    routes = data.routes.map((route) => {
      const { file, ...rest } = route;
      void file;
      return rest;
    });
  }

  const endpointCount =
    data.endpointCount ||
    routes.reduce((n, r) => n + (r.methods?.length || 0), 0);

  if (routes.length === 0) {
    return {
      routes: [],
      debug: {
        searchRoot: "src/app/api",
        filesFound: [],
        routesGenerated: 0,
        endpointCount: 0,
        manifestLoaded: true,
        manifestGeneratedAt: data.generatedAt || null,
        source: "public-manifest",
        error:
          "public/api-manifest.json loaded but contains 0 endpoints. Re-run npm run generate:api-manifest.",
      },
    };
  }

  return {
    routes,
    debug: {
      searchRoot: "src/app/api",
      filesFound: [],
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
          filesFound: [],
          routesGenerated: routes.length,
          endpointCount: routes.reduce((n, r) => n + r.methods.length, 0),
          manifestLoaded: true,
          manifestGeneratedAt: null,
          source: "admin-catalog",
          error: null,
        },
      };
    }
    errors.push(res.debug?.error || "Admin catalog API returned 0 routes.");
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
