/**
 * Generate api-manifest.json from real App Router route.ts files.
 * Run: node scripts/generate-api-manifest.mjs
 * Hooked via predev / prebuild so the Admin API catalog never depends on
 * runtime filesystem access (unavailable on Vercel serverless).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiRoot = path.join(root, "src", "app", "api");
const outServer = path.join(
  root,
  "src",
  "server",
  "helia",
  "api-catalog",
  "api-manifest.json"
);
const outTs = path.join(
  root,
  "src",
  "server",
  "helia",
  "api-catalog",
  "api-manifest.generated.ts"
);
const outPublic = path.join(root, "public", "api-manifest.json");

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const GROUP_MAP = {
  auth: "Authentication",
  apikeys: "API Keys",
  organizations: "Organizations",
  projects: "Projects",
  brain: "Brain",
  admin: "Admin",
};

function groupFor(urlPath) {
  const parts = urlPath.replace(/^\/api\//, "").split("/");
  const top = parts[0] || "Other";

  if (top === "admin") {
    const sub = parts[1] || "";
    if (sub === "applications") return "Applications";
    if (sub === "analytics") return "Analytics";
    if (sub === "logs") return "Logs";
    if (sub === "health" || sub === "system-health") return "Health";
    if (sub === "overview") return "Health";
    if (sub === "tester") return "Admin";
    if (sub === "users") return "Admin";
    if (sub === "organizations") return "Organizations";
    if (sub === "apikeys") return "API Keys";
    if (sub === "settings") return "Admin";
    if (sub === "chat") return "Chat";
    if (sub === "bootstrap-promote") return "Admin";
    return "Admin";
  }

  if (top === "brain") {
    if (parts[1] === "ask" || parts[1] === "conversations") return "Chat";
    return "Brain";
  }

  if (top === "organizations" && parts[1] === "usage") return "Usage";
  if (top === "organizations" && parts[1] === "plans") return "Organizations";
  if (top === "docs" || top === "openapi.json") return "Documentation";

  return GROUP_MAP[top] || top.charAt(0).toUpperCase() + top.slice(1);
}

function cleanJsDoc(raw) {
  const text = raw
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter((l) => l && !l.startsWith("@"))
    .join(" ")
    .trim();
  return text || null;
}

function extractJsDocDescription(src, method) {
  const re = new RegExp(
    `/\\*\\*([\\s\\S]*?)\\*/\\s*export\\s+async\\s+function\\s+${method}\\b`
  );
  const m = src.match(re);
  if (!m) {
    const top = src.match(/^\/\*\*([\s\S]*?)\*\//);
    if (!top) return null;
    return cleanJsDoc(top[1]);
  }
  return cleanJsDoc(m[1]);
}

function extractQueryParams(src) {
  const found = new Set();
  const re = /searchParams\.get\(\s*["']([^"']+)["']\s*\)/g;
  let m;
  while ((m = re.exec(src)) !== null) found.add(m[1]);
  return [...found].sort();
}

function extractBodyFields(src) {
  const found = new Set();
  const re = /\bbody(?:\?)?\.(?:(\w+))/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (!["trim", "toString", "length"].includes(m[1])) found.add(m[1]);
  }
  const re2 = /typeof\s+body\.(\w+)/g;
  while ((m = re2.exec(src)) !== null) found.add(m[1]);
  return [...found].sort();
}

function extractPathParams(urlPath) {
  const out = [];
  const re = /:([A-Za-z_][A-Za-z0-9_]*)/g;
  let m;
  while ((m = re.exec(urlPath)) !== null) out.push(m[1]);
  return out;
}

function inferAuth(src) {
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

console.log("Search root:", apiRoot);

if (!fs.existsSync(apiRoot)) {
  console.error("ERROR: API root does not exist. Expected App Router at src/app/api.");
  process.exit(1);
}

const pagesApi = path.join(root, "pages", "api");
console.log(
  "Router:",
  "Next.js App Router (src/app/api/**/route.ts)",
  fs.existsSync(pagesApi) ? "+ pages/api also present" : "(no pages/api)"
);

/** @type {string[]} */
const filesFound = [];
/** @type {Map<string, { methods: string[], file: string, src: string }>} */
const byPath = new Map();

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p);
      continue;
    }
    if (ent.name !== "route.ts" && ent.name !== "route.js") continue;

    const relFile = path.relative(root, p).split(path.sep).join("/");
    filesFound.push(relFile);

    const src = fs.readFileSync(p, "utf8");
    const rel = path.relative(apiRoot, path.dirname(p)).split(path.sep).join("/");
    const urlPath =
      "/api" + (rel ? `/${rel}` : "").replace(/\[([^\]]+)\]/g, ":$1");
    const methods = METHODS.filter((m) =>
      new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(src)
    );
    if (!methods.length) continue;

    const existing = byPath.get(urlPath);
    if (existing) {
      for (const m of methods) {
        if (!existing.methods.includes(m)) existing.methods.push(m);
      }
    } else {
      byPath.set(urlPath, { methods: [...methods], file: relFile, src });
    }
  }
}

walk(apiRoot);

console.log("Found route files:");
for (const f of filesFound.sort()) console.log(" ", f);

/** @type {any[]} */
const routes = [];
/** @type {{ method: string, path: string, category: string }[]} */
const endpoints = [];

for (const [urlPath, meta] of byPath) {
  meta.methods.sort((a, b) => METHODS.indexOf(a) - METHODS.indexOf(b));
  const auth = inferAuth(meta.src);
  const category = groupFor(urlPath);
  const bodyFields = extractBodyFields(meta.src);
  const description =
    meta.methods.map((m) => extractJsDocDescription(meta.src, m)).find(Boolean) ||
    null;

  routes.push({
    path: urlPath,
    methods: meta.methods,
    group: category,
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
    multipart: /formData\s*\(/.test(meta.src),
    apiKeySupported: auth.apiKeySupported,
    sessionRequired: auth.sessionRequired,
  });

  for (const method of meta.methods) {
    endpoints.push({ method, path: urlPath, category });
  }
}

routes.sort(
  (a, b) => a.group.localeCompare(b.group) || a.path.localeCompare(b.path)
);
endpoints.sort(
  (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)
);

console.log("Generated routes:");
for (const e of endpoints) {
  console.log(`  ${e.method.padEnd(6)} ${e.path}  [${e.category}]`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  router: "app",
  searchRoot: "src/app/api",
  filesFound: filesFound.sort(),
  routeCount: routes.length,
  endpointCount: endpoints.length,
  routes,
  endpoints,
};

fs.mkdirSync(path.dirname(outServer), { recursive: true });
fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.writeFileSync(outServer, JSON.stringify(manifest, null, 2) + "\n", "utf8");
fs.writeFileSync(outPublic, JSON.stringify(manifest, null, 2) + "\n", "utf8");

const tsBody = `/**
 * AUTO-GENERATED by scripts/generate-api-manifest.mjs — do not edit by hand.
 * Regenerated on npm run dev / npm run build.
 */
export type ApiManifestRoute = {
  path: string;
  methods: Array<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">;
  group: string;
  file: string;
  description: string | null;
  authentication: string;
  permissions: string[];
  queryParameters: string[];
  pathParameters: string[];
  bodyFields: string[];
  bodySchemaHint: string | null;
  multipart: boolean;
  apiKeySupported: boolean;
  sessionRequired: boolean;
};

export type ApiManifest = {
  generatedAt: string;
  router: string;
  searchRoot: string;
  filesFound: string[];
  routeCount: number;
  endpointCount: number;
  routes: ApiManifestRoute[];
  endpoints: Array<{ method: string; path: string; category: string }>;
};

const API_MANIFEST = ${JSON.stringify(manifest, null, 2)} as ApiManifest;

export default API_MANIFEST;
`;

fs.writeFileSync(outTs, tsBody, "utf8");

console.log(`\nWrote ${outServer}`);
console.log(`Wrote ${outTs}`);
console.log(`Wrote ${outPublic}`);
console.log(`Endpoint count: ${endpoints.length}`);

if (endpoints.length === 0) {
  console.error("ERROR: Generated 0 endpoints. Check Search root / Found route files above.");
  process.exit(1);
}
