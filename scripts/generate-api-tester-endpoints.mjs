/**
 * Optional audit helper. Live catalog comes from discoverApiRoutes()
 * via GET /api/admin/tester/catalog — no hardcoded endpoint lists.
 *
 * Run: node scripts/generate-api-tester-endpoints.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Prefer compiled/runtime discovery note — print filesystem scan via inline JS
const apiRoot = path.join(root, "src", "app", "api");
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/** @type {{ path: string, methods: string[], file: string }[]} */
const routes = [];
const byPath = new Map();

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p);
      continue;
    }
    if (ent.name !== "route.ts" && ent.name !== "route.js") continue;
    const src = fs.readFileSync(p, "utf8");
    const rel = path.relative(apiRoot, path.dirname(p)).split(path.sep).join("/");
    const urlPath =
      "/api" + (rel ? `/${rel}` : "").replace(/\[([^\]]+)\]/g, ":$1");
    const file = path.relative(root, p).split(path.sep).join("/");
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
      byPath.set(urlPath, { path: urlPath, methods: [...methods], file });
    }
  }
}

walk(apiRoot);
for (const r of byPath.values()) {
  r.methods.sort((a, b) => METHODS.indexOf(a) - METHODS.indexOf(b));
  routes.push(r);
}
routes.sort((a, b) => a.path.localeCompare(b.path));

console.log(`Discovered ${routes.length} API route paths under src/app/api:\n`);
for (const r of routes) {
  console.log(`  ${r.methods.join("|").padEnd(24)} ${r.path}`);
}
console.log(
  `\nAdmin UI loads this catalog live from GET /api/admin/tester/catalog (no commit required).`
);

// Keep require available for tooling that may extend this script later.
void createRequire;
