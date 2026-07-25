/**
 * Helia Administrator security policy — blocks secret disclosure and dangerous ops.
 */

import { SECURITY_BLOCKED_MESSAGE } from "./system-prompt";

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\b(show|print|dump|reveal|expose|list|get|give)\b.{0,60}\b(env|environment variables?|secrets?|credentials?|\.env)\b/i,
  /\b(env|secrets?|credentials?|şifre|gizli)\b.{0,40}\b(göster|ver|yazdır|paylaş|dump|print|show)\b/i,
  /\b(process\.env|HELIA_ADMIN_PASSWORD|CLOUD_JWT|OPENAI|API[_ ]?KEY[_ ]?PEPPER|SUPABASE_SERVICE_ROLE)\b/i,
  /\b(jwt secrets?|session secrets?|cookie values?|private keys?|database passwords?|admin passwords?)\b/i,
  /\b(api key hashes?|password hashes?|secretHash|refresh token|access token secret)\b/i,
  /\bdump (the )?database\b/i,
  /\bdelete (the )?database\b/i,
  /\b(veritabanı|database).{0,20}(sil|dump|boşalt)\b/i,
  /\bpromote (a )?user\b/i,
  /\bkullanıcı.{0,20}yükselt\b/i,
  /\b(execute|run)\b.{0,20}\b(shell|terminal|bash|powershell|cmd)\b/i,
  /\b(terminal|shell|komut).{0,20}(çalıştır|execute|run)\b/i,
  /\b(delete|rm|unlink)\b.{0,30}\b(files?|filesystem|server)\b/i,
  /\b(dosya|sunucu).{0,20}(sil|değiştir)\b/i,
  /\bmodify (the )?server\b/i,
  /\bread (the )?(filesystem|\.env)\b/i,
  /\bcat\s+\.env\b/i,
  /\bwhoami\s+as\s+root\b/i,
  /\b(full|plaintext)\s+(api\s*)?key\b/i,
  /\bham\s+(api\s*)?anahtar\b/i,
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
