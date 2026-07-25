/**
 * Searchable Helia documentation index (sourced from product docs — not invented).
 */

import { NO_DOCUMENTATION_MESSAGE } from "./system-prompt";
import { formatAdminSections } from "./response-format";

export type DocArticle = {
  id: string;
  title: string;
  keywords: string[];
  body: string;
};

/** Official Helia Suite documentation snippets used by the Administrator. */
export const HELIA_DOC_INDEX: DocArticle[] = [
  {
    id: "quick-start",
    title: "Quick Start",
    keywords: ["quick start", "getting started", "api key", "begin", "setup"],
    body: `1. Generate an API Key in the dashboard (live or test) with required capabilities.
2. Copy the secret immediately — it is shown once; store it in a secrets manager.
3. Send the key from your server with: Authorization: Bearer <api_key>
Never embed live keys in public client bundles.`,
  },
  {
    id: "authentication",
    title: "Authentication",
    keywords: ["auth", "authentication", "bearer", "authorization", "hl_live", "hl_test"],
    body: `All Helia REST calls require:
Authorization: Bearer hl_live_… or hl_test_…
Content-Type: application/json (for POST bodies)

Invalid or missing keys return 401. Valid keys without required capability/permission return 403.`,
  },
  {
    id: "rest-api",
    title: "REST API",
    keywords: ["rest", "endpoint", "/v1", "chat", "usage", "account", "monitor", "knowledge"],
    body: `Primary endpoints:
- POST /v1/chat — workspace assistant message
- POST /v1/knowledge/search — knowledge search
- POST /v1/monitor/events — monitoring ingest
- POST /v1/notifications/send — notification dispatch
- GET /v1/usage — period usage counters
- GET /v1/account — account/org profile for the key

Base host for examples: https://api.helia.ai (replace with your deployed Suite origin when calling same-origin APIs).`,
  },
  {
    id: "api-keys",
    title: "API Keys",
    keywords: [
      "api key",
      "api keys",
      "permissions",
      "capabilities",
      "application type",
      "rotate",
      "disable",
      "whoami",
    ],
    body: `API Keys bind an application type, capabilities, and permissions.
Application types: web, mobile, backend, saas, internal_platform.
Permissions: read, write, execute, admin.
Capabilities include monitoring, health, logs, brain, webhooks, analytics, and more.
Internal Platform receives all capabilities and permissions.
Rotate replaces the secret; disable stops acceptance; delete removes the key.
WhoAmI / account endpoints describe the org and plan bound to the key — never return the secret hash.`,
  },
  {
    id: "error-codes",
    title: "Error Codes",
    keywords: ["401", "403", "404", "429", "500", "error code", "errors"],
    body: `401 Unauthorized — missing/malformed/invalid API key or Bearer token.
403 Forbidden — key valid but lacks capability/permission.
404 Not Found — unknown path/resource.
429 Too Many Requests — quota exceeded; respect Retry-After.
500 Internal Server Error — unexpected failure; retry with backoff.`,
  },
  {
    id: "webhooks",
    title: "Webhooks",
    keywords: ["webhook", "webhooks", "callback", "signature"],
    body: `Webhooks deliver platform events to your HTTPS endpoint.
Verify signatures before processing.
Respond quickly with 2xx; use retries/idempotency for delayed handlers.
Store webhook secrets in a secrets manager — never in client code.`,
  },
  {
    id: "rate-limits",
    title: "Rate Limits",
    keywords: ["rate limit", "quota", "rpm", "burst", "429"],
    body: `Helia enforces per-minute, burst, and monthly quotas by plan.
On 429, back off and retry after Retry-After.
Track usage via GET /v1/usage and the dashboard Usage page.`,
  },
  {
    id: "best-practices",
    title: "Best Practices",
    keywords: ["best practice", "security", "retry", "cache"],
    body: `Keep API keys server-side only.
Use least-privilege capabilities/permissions.
Retry transient 5xx/429 with exponential backoff.
Log request ids, never log full secrets.
Prefer test keys in non-production.`,
  },
];

export function searchDocumentation(queryRaw: string): string | null {
  const q = queryRaw.trim().toLowerCase();
  if (!q) return null;

  const wantsDocs =
    /\b(doc|docs|documentation|explain (the )?api|how (do|does|to)|what is|quick start|authentication|webhook|rate limit)\b/i.test(
      q
    ) || /\b(endpoint|rest api|sdk)\b/i.test(q);

  if (!wantsDocs && !HELIA_DOC_INDEX.some((d) => d.keywords.some((k) => q.includes(k)))) {
    return null;
  }

  const scored = HELIA_DOC_INDEX.map((doc) => {
    let score = 0;
    if (q.includes(doc.id.replace(/-/g, " "))) score += 5;
    if (q.includes(doc.title.toLowerCase())) score += 5;
    for (const kw of doc.keywords) {
      if (q.includes(kw)) score += 3;
    }
    for (const token of q.split(/\s+/)) {
      if (token.length < 3) continue;
      if (doc.body.toLowerCase().includes(token)) score += 1;
    }
    return { doc, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    if (wantsDocs) {
      return formatAdminSections({
        status: "Documentation lookup",
        summary: NO_DOCUMENTATION_MESSAGE,
        recommendation: "Open Dashboard → Documentation or ask about a listed section (Authentication, REST API, API Keys, Webhooks).",
        nextStep: "Retry with a more specific Helia Suite topic.",
      });
    }
    return null;
  }

  const top = scored.slice(0, 2);
  const body = top
    .map((t) => `### ${t.doc.title}\n${t.doc.body}`)
    .join("\n\n");

  return formatAdminSections({
    status: "Documentation",
    summary: `Matched official Helia documentation: ${top.map((t) => t.doc.title).join(", ")}.`,
    extraSections: [{ title: "Details", body }],
    recommendation: "Use Dashboard → Documentation for the full reference and API Explorer.",
    nextStep: "Ask for a language-specific example if you need integration code.",
  });
}
