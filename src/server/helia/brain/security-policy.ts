/**
 * Helia Administrator security policy — blocks secret disclosure and dangerous ops.
 */

import { SECURITY_BLOCKED_MESSAGE } from "./system-prompt";

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\b(show|print|dump|reveal|expose|list)\b.{0,40}\b(env|environment variables?|secrets?|credentials?)\b/i,
  /\b(process\.env|HELIA_ADMIN_PASSWORD|CLOUD_JWT|OPENAI|API[_ ]?KEY[_ ]?PEPPER)\b/i,
  /\b(jwt secrets?|session secrets?|cookie values?|private keys?|database passwords?)\b/i,
  /\b(api key hashes?|password hashes?|secretHash|refresh token)\b/i,
  /\bdump (the )?database\b/i,
  /\bdelete (the )?database\b/i,
  /\bpromote (a )?user\b/i,
  /\b(execute|run)\b.{0,20}\b(shell|terminal|bash|powershell|cmd)\b/i,
  /\b(delete|rm|unlink)\b.{0,30}\b(files?|filesystem|server)\b/i,
  /\bmodify (the )?server\b/i,
  /\bread (the )?(filesystem|\.env)\b/i,
  /\bcat\s+\.env\b/i,
  /\bwhoami\s+as\s+root\b/i,
];

export function matchSecurityPolicy(question: string): string | null {
  const text = question.trim();
  if (!text) return null;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      return SECURITY_BLOCKED_MESSAGE;
    }
  }
  return null;
}
