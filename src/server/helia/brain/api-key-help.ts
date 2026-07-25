/**
 * API Key administration help — grounded in the real catalog.
 */

import {
  API_CAPABILITIES,
  API_CAPABILITY_LABELS,
  API_PERMISSIONS,
  API_PERMISSION_LABELS,
  APPLICATION_TYPES,
  APPLICATION_TYPE_LABELS,
} from "@/lib/api-keys/catalog";
import { formatAdminSections } from "./response-format";

export function answerApiKeyHelp(questionRaw: string): string | null {
  const q = questionRaw.trim().toLowerCase();
  const wants =
    /\b(api keys?|permissions?|capabilities?|application types?|rotate|disable|delete key|whoami|access policy)\b/i.test(
      q
    );
  if (!wants) return null;

  const capabilities = API_CAPABILITIES.map(
    (c) => `- ${c}: ${API_CAPABILITY_LABELS[c]}`
  ).join("\n");
  const permissions = API_PERMISSIONS.map(
    (p) => `- ${p}: ${API_PERMISSION_LABELS[p]}`
  ).join("\n");
  const appTypes = APPLICATION_TYPES.map(
    (t) => `- ${t}: ${APPLICATION_TYPE_LABELS[t]}`
  ).join("\n");

  let focus = "Overview of Helia API Keys, permissions, capabilities, and lifecycle.";
  if (/\brotate\b/i.test(q)) {
    focus =
      "Rotate replaces the secret material. The previous secret stops working after rotation. Store the new secret immediately — it is shown once.";
  } else if (/\bdisable\b/i.test(q)) {
    focus =
      "Disable marks the key inactive so gateway authentication rejects it without deleting history.";
  } else if (/\bdelete\b/i.test(q)) {
    focus =
      "Delete permanently removes the key record. Prefer disable when you may need audit continuity.";
  } else if (/\bwhoami\b/i.test(q)) {
    focus =
      "WhoAmI / GET /v1/account returns organization and plan metadata for the presenting key. It never returns the secret or secretHash.";
  } else if (/\bpermission/i.test(q)) {
    focus = "Permissions gate read/write/execute/admin actions for the key.";
  } else if (/\bcapabilit/i.test(q)) {
    focus = "Capabilities gate product surfaces (monitoring, brain, webhooks, …).";
  }

  return formatAdminSections({
    status: "API Keys",
    summary: focus,
    extraSections: [
      { title: "Application types", body: appTypes },
      { title: "Permissions", body: permissions },
      { title: "Capabilities", body: capabilities },
      {
        title: "Lifecycle",
        body: `Create → copy secret once → assign capabilities/permissions → use Authorization Bearer.
Rotate when leaked. Disable to stop traffic. Delete to remove. Internal Platform receives all capabilities and permissions.`,
      },
    ],
    recommendation:
      "Use least privilege. Prefer test keys in non-production. Never return hashes or full secrets in chat or logs.",
    nextStep:
      "Open Admin → API Keys / Applications to inspect live keys, or ask for a language-specific integration example.",
  });
}
