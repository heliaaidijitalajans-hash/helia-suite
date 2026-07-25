/**
 * Error analysis for pasted Helia / HTTP failures.
 */

import { formatAdminSections } from "./response-format";

const KNOWN: Array<{
  match: RegExp;
  title: string;
  explain: string;
  rootCause: string;
  possible: string;
  recommended: string;
}> = [
  {
    match: /\b401\b|unauthorized|invalid (api )?key|missing authentication/i,
    title: "401 Unauthorized",
    explain:
      "The gateway rejected the credential before executing the business method.",
    rootCause:
      "Missing Authorization header, malformed Bearer token, revoked/rotated key, or wrong key environment.",
    possible:
      "Confirm the header format Authorization: Bearer hl_live_… (or hl_test_…). Ensure the key was not rotated/disabled.",
    recommended:
      "Recreate or rotate the key in the dashboard, update the server secret store, and retry a minimal GET /v1/account call.",
  },
  {
    match: /\b403\b|forbidden|lacks? (capability|permission)|admin access required/i,
    title: "403 Forbidden",
    explain:
      "Authentication succeeded but authorization failed for the requested operation.",
    rootCause:
      "The API key’s capabilities/permissions (or user role) do not include the required scope.",
    possible:
      "Add the missing capability/permission, use an Internal Platform key for full access, or sign in as a platform admin for Admin APIs.",
    recommended:
      "Inspect the key policy in Admin → Applications / API Keys and align capabilities with the endpoint.",
  },
  {
    match: /\b429\b|too many requests|rate limit|quota/i,
    title: "429 Too Many Requests",
    explain: "A plan quota or burst limit was exceeded.",
    rootCause: "Per-minute, burst, or monthly usage limits for the organization/plan.",
    possible:
      "Back off using Retry-After, reduce concurrency, or upgrade plan limits.",
    recommended:
      "Check GET /v1/usage and Admin → Analytics, then implement exponential backoff.",
  },
  {
    match: /\b404\b|not found/i,
    title: "404 Not Found",
    explain: "The path or resource id does not exist for this deployment/workspace.",
    rootCause: "Wrong URL path, typo, or resource already deleted.",
    possible: "Verify the endpoint against Documentation → REST API and confirm resource ids.",
    recommended: "Call a known endpoint such as GET /v1/account to validate base URL and auth first.",
  },
  {
    match: /\b500\b|internal server error/i,
    title: "500 Internal Server Error",
    explain: "The platform hit an unexpected failure while handling the request.",
    rootCause: "Transient runtime fault or dependency error on the Suite deployment.",
    possible: "Retry with backoff. If persistent, inspect Admin → Logs and System Health.",
    recommended:
      "Capture request time + endpoint, check recent errors in Admin → Logs, then retry once health is green.",
  },
];

export function analyzeError(questionRaw: string): string | null {
  const q = questionRaw.trim();
  if (
    !/\b(error|exception|failed|stack|traceback|status code|http)\b/i.test(q) &&
    !/\b(401|403|404|429|500)\b/.test(q)
  ) {
    return null;
  }

  const hit = KNOWN.find((k) => k.match.test(q));
  if (!hit) {
    return formatAdminSections({
      status: "Error analysis",
      summary:
        "I can analyze Helia/HTTP errors when a status code or clear failure signal is present. No confident match was found for this paste.",
      recommendation:
        "Include the HTTP status, endpoint path, and response body (redact secrets).",
      nextStep: "Paste a 401/403/429/500 response or ask about a specific Helia error code.",
    });
  }

  return formatAdminSections({
    status: hit.title,
    summary: hit.explain,
    extraSections: [
      { title: "Root cause", body: hit.rootCause },
      { title: "Possible fix", body: hit.possible },
      { title: "Recommended fix", body: hit.recommended },
    ],
    nextStep: "Retry the failing call after applying the recommended fix; if it persists, check Admin → Logs.",
  });
}
