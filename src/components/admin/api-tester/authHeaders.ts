/**
 * Re-export shared API Tester auth helpers for client components.
 * Implementation lives in @/lib/admin/api-tester-auth (also used by execute proxy).
 */

export {
  apiKeyExportPlaceholder,
  buildAuthenticatedHeaders,
  getAuthCompatibility,
  normalizeApiKeyInput,
  redactHeadersForDisplay,
  resolveAuthModeForRoute,
  sanitizeHeadersForCodeExport,
  stripAuthHeaders,
  type AuthCompatibility,
  type AuthMode,
} from "@/lib/admin/api-tester-auth";
