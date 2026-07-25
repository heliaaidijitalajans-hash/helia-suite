/**
 * Strip secrets / credentials from assistant text before it reaches the user.
 */

const REDACT = "[redacted]";

const PATTERNS: RegExp[] = [
  /\bhl_(?:live|test)_[A-Za-z0-9_-]{8,}\b/g,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, // JWT
  /\b(?:CLOUD_JWT_[A-Z_]+|HELIA_ADMIN_PASSWORD|HELIA_ADMIN_BOOTSTRAP_SECRET|CLOUD_API_KEY_PEPPER|OPENAI_API_KEY|HELIA_LLM_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*\S+/gi,
  /\b(?:password|passwd|secret|api[_-]?key|token)\s*[=:]\s*["']?[^\s"']{6,}/gi,
  /\bscrypt\$[a-f0-9]+\$[a-f0-9]+\b/gi,
  /\bsecretHash\s*[=:]\s*\S+/gi,
  /(?:^|\n)\s*[A-Z0-9_]*(?:SECRET|PASSWORD|TOKEN|PRIVATE_KEY)[A-Z0-9_]*\s*=\s*.+$/gim,
];

export function sanitizeAssistantOutput(text: string): string {
  let out = text;
  for (const pattern of PATTERNS) {
    out = out.replace(pattern, REDACT);
  }
  return out;
}
