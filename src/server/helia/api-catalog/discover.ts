/**
 * Discover every Next.js App Router API route under src/app/api.
 * Used by Admin API Tester + API Explorer (no hardcoded endpoint lists).
 */

import fs from "node:fs";
import path from "node:path";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type AuthType =
  | "api_key"
  | "session"
  | "admin_session"
  | "public"
  | "mixed"
  | "unknown";

export type DiscoveredRoute = {
  path: string;
  methods: HttpMethod[];
  group: string;
  file: string;
  description: string | null;
  authentication: AuthType;
  permissions: string[];
  queryParameters: string[];
  pathParameters: string[];
  bodyFields: string[];
  bodySchemaHint: string | null;
  multipart: boolean;
  apiKeySupported: boolean;
  sessionRequired: boolean;
};

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const GROUP_MAP: Record<string, string> = {
  auth: "Authentication",
  apikeys: "API Keys",
  organizations: "Organizations",
  projects: "Projects",
  brain: "Brain",
  admin: "Admin",
};

function groupFor(urlPath: string): string {
  const parts = urlPath.replace(/^\/api\//, "").split("/");
  const top = parts[0] || "Other";

  if (top === "admin") {
    const sub = parts[1] || "";
    if (sub === "applications") return "Applications";
    if (sub === "analytics") return "Analytics";
    if (sub === "logs") return "Logs";
    if (sub === "health" || sub === "system-health") return "Health";
    if (sub === "overview") return "Monitoring";
    if (sub === "tester") return "Admin";
    if (sub === "users") return "Admin";
    if (sub === "organizations") return "Organizations";
    if (sub === "apikeys") return "API Keys";
    if (sub === "settings") return "Admin";
    if (sub === "chat") return "Chat";
    return "Admin";
  }

  if (top === "brain") {
    if (parts[1] === "ask" || parts[1] === "conversations") return "Chat";
    return "Brain";
  }

  if (top === "organizations" && parts[1] === "usage") return "Usage";
  if (top === "organizations" && parts[1] === "plans") return "Organizations";

  return GROUP_MAP[top] || top.charAt(0).toUpperCase() + top.slice(1);
}

function extractJsDocDescription(src: string, method: HttpMethod): string | null {
  const re = new RegExp(
    `/\\*\\*([\\s\\S]*?)\\*/\\s*export\\s+async\\s+function\\s+${method}\\b`
  );
  const m = src.match(re);
  if (!m) {
    // File-level JSDoc before first export
    const top = src.match(/^\/\*\*([\s\S]*?)\*\//);
    if (!top) return null;
    return cleanJsDoc(top[1]);
  }
  return cleanJsDoc(m[1]);
}

function cleanJsDoc(raw: string): string | null {
  const text = raw
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter((l) => l && !l.startsWith("@"))
    .join(" ")
    .trim();
  return text || null;
}

function extractQueryParams(src: string): string[] {
  const found = new Set<string>();
  const re = /searchParams\.get\(\s*["']([^"']+)["']\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) found.add(m[1]);
  return [...found].sort();
}

function extractBodyFields(src: string): string[] {
  const found = new Set<string>();
  // body.field or body?.field
  const re = /\bbody(?:\?)?\.(?:(\w+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (!["trim", "toString", "length"].includes(m[1])) found.add(m[1]);
  }
  // typeof body.x === "string"
  const re2 = /typeof\s+body\.(\w+)/g;
  while ((m = re2.exec(src)) !== null) found.add(m[1]);
  return [...found].sort();
}

function extractPathParams(urlPath: string): string[] {
  const out: string[] = [];
  const re = /:([A-Za-z_][A-Za-z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(urlPath)) !== null) out.push(m[1]);
  return out;
}

function inferAuth(src: string): {
  authentication: AuthType;
  permissions: string[];
  apiKeySupported: boolean;
  sessionRequired: boolean;
} {
  const hasApiKey =
    /authenticateApiKey\s*\(/.test(src) && !/requireAdminUser\s*\(/.test(src);
  const admin =
    /requireAdminUser\s*\(/.test(src) || /requireAdminBrainContext\s*\(/.test(src);
  const session = /requireCloudUser\s*\(/.test(src) && !admin;
  const publicNoAuth =
    !hasApiKey &&
    !admin &&
    !session &&
    !/requireCloudUser|requireAdminUser|requireAdminBrainContext|authenticateApiKey/.test(
      src
    );

  if (hasApiKey) {
    return {
      authentication: "api_key",
      permissions: ["api_key"],
      apiKeySupported: true,
      sessionRequired: false,
    };
  }
  if (admin) {
    return {
      authentication: "admin_session",
      permissions: ["admin"],
      apiKeySupported: false,
      sessionRequired: true,
    };
  }
  if (session) {
    return {
      authentication: "session",
      permissions: ["authenticated"],
      apiKeySupported: false,
      sessionRequired: true,
    };
  }
  if (publicNoAuth) {
    return {
      authentication: "public",
      permissions: [],
      apiKeySupported: false,
      sessionRequired: false,
    };
  }
  return {
    authentication: "unknown",
    permissions: [],
    apiKeySupported: false,
    sessionRequired: false,
  };
}

function resolveApiRoot(cwd = process.cwd()): string {
  return path.join(cwd, "src", "app", "api");
}

/**
 * Walk the filesystem and build the live API catalog.
 */
export function discoverApiRoutes(cwd = process.cwd()): DiscoveredRoute[] {
  const apiRoot = resolveApiRoot(cwd);
  if (!fs.existsSync(apiRoot)) return [];

  /** @type {Map<string, { methods: HttpMethod[]; file: string; src: string }>} */
  const byPath = new Map<
    string,
    { methods: HttpMethod[]; file: string; src: string }
  >();

  function walk(dir: string) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(p);
        continue;
      }
      if (ent.name !== "route.ts" && ent.name !== "route.js") continue;

      const src = fs.readFileSync(p, "utf8");
      const rel = path
        .relative(apiRoot, path.dirname(p))
        .split(path.sep)
        .join("/");
      const urlPath =
        "/api" + (rel ? `/${rel}` : "").replace(/\[([^\]]+)\]/g, ":$1");
      const file = path.relative(cwd, p).split(path.sep).join("/");
      const methods = METHODS.filter((m) =>
        new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(src)
      );
      if (methods.length === 0) continue;

      const existing = byPath.get(urlPath);
      if (existing) {
        for (const m of methods) {
          if (!existing.methods.includes(m)) existing.methods.push(m);
        }
      } else {
        byPath.set(urlPath, { methods: [...methods], file, src });
      }
    }
  }

  walk(apiRoot);

  const routes: DiscoveredRoute[] = [];
  for (const [urlPath, meta] of byPath) {
    meta.methods.sort(
      (a, b) => METHODS.indexOf(a) - METHODS.indexOf(b)
    );
    const auth = inferAuth(meta.src);
    const descriptions = meta.methods
      .map((m) => extractJsDocDescription(meta.src, m))
      .filter(Boolean);
    const description =
      descriptions[0] ||
      extractJsDocDescription(meta.src, meta.methods[0]) ||
      null;

    const bodyFields = extractBodyFields(meta.src);
    const multipart = /formData\s*\(/.test(meta.src);

    routes.push({
      path: urlPath,
      methods: meta.methods,
      group: groupFor(urlPath),
      file: meta.file,
      description,
      authentication: auth.authentication,
      permissions: auth.permissions,
      queryParameters: extractQueryParams(meta.src),
      pathParameters: extractPathParams(urlPath),
      bodyFields,
      bodySchemaHint:
        bodyFields.length > 0
          ? JSON.stringify(
              Object.fromEntries(bodyFields.map((f) => [f, ""])),
              null,
              2
            )
          : meta.methods.some((m) => m === "POST" || m === "PUT" || m === "PATCH")
            ? "{\n  \n}"
            : null,
      multipart,
      apiKeySupported: auth.apiKeySupported,
      sessionRequired: auth.sessionRequired,
    });
  }

  routes.sort(
    (a, b) =>
      a.group.localeCompare(b.group) ||
      a.path.localeCompare(b.path)
  );

  return routes;
}

/** Match a concrete or templated path against the catalog. */
export function findRouteInCatalog(
  routes: DiscoveredRoute[],
  requestPath: string
): DiscoveredRoute | null {
  const pathOnly = (requestPath.split("?")[0] || "").trim();
  if (!pathOnly.startsWith("/api/")) return null;

  const exact = routes.find((r) => r.path === pathOnly);
  if (exact) return exact;

  for (const r of routes) {
    if (!r.path.includes(":")) continue;
    const pattern = new RegExp(
      "^" +
        r.path
          .split("/")
          .map((seg) =>
            seg.startsWith(":") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          )
          .join("/") +
        "$"
    );
    if (pattern.test(pathOnly)) return r;
  }
  return null;
}

export function applyPathParams(
  template: string,
  params: Record<string, string>
): string {
  return template.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, key: string) => {
    const v = params[key]?.trim();
    return v ? encodeURIComponent(v) : `:${key}`;
  });
}
