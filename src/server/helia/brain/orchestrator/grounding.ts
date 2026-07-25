/**
 * Factual grounding — LLM answers may only use numbers/IDs/names
 * that appear in live tool JSON. Drift → reject (caller falls back).
 */

import type { LlmContextPacket } from "./context-builder";

export type GroundTruth = {
  /** Exact numeric tokens allowed in the answer (as strings). */
  numbers: Set<string>;
  /** Lowercased names / statuses / plan ids / environments allowed. */
  tokens: Set<string>;
  /** Key/project/org ids (prefix matched). */
  ids: Set<string>;
};

function addNumber(set: Set<string>, value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    set.add(String(value));
    // Also allow integer form of floats like 1.0 → 1 already covered
    if (Number.isInteger(value)) set.add(String(Math.trunc(value)));
  }
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    set.add(value.trim());
  }
}

function addToken(set: Set<string>, value: unknown) {
  if (typeof value !== "string") return;
  const v = value.trim();
  if (v.length < 2) return;
  set.add(v.toLocaleLowerCase("tr-TR"));
}

function walk(value: unknown, truth: GroundTruth, depth = 0) {
  if (depth > 8 || value == null) return;
  if (typeof value === "number") {
    addNumber(truth.numbers, value);
    return;
  }
  if (typeof value === "string") {
    addToken(truth.tokens, value);
    if (/^(key_|org_|prj_|usr_|sub_|mem_)/i.test(value)) {
      truth.ids.add(value);
    }
    // hl_test_ab12 style prefixes (not full secrets)
    if (/^hl_(live|test)_[A-Za-z0-9]{2,8}$/i.test(value)) {
      addToken(truth.tokens, value);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 80)) walk(item, truth, depth + 1);
    addNumber(truth.numbers, value.length);
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      addToken(truth.tokens, k);
      walk(v, truth, depth + 1);
    }
  }
}

/** Always-allowed small numbers / common words (not platform metrics). */
const UNIVERSAL_NUMBERS = new Set([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "12",
  "24",
  "30",
  "60",
  "100",
  "401",
  "403",
  "404",
  "429",
  "500",
]);

export function buildGroundTruth(packet: LlmContextPacket): GroundTruth {
  const truth: GroundTruth = {
    numbers: new Set(UNIVERSAL_NUMBERS),
    tokens: new Set(),
    ids: new Set(),
  };

  for (const tool of packet.tools) {
    walk(tool.data, truth);
    addToken(truth.tokens, tool.tool);
    addToken(truth.tokens, tool.intent);
  }

  // Safe platform vocabulary
  for (const t of [
    "helia",
    "api",
    "key",
    "keys",
    "anahtar",
    "aktif",
    "pasif",
    "active",
    "disabled",
    "live",
    "test",
    "healthy",
    "sağlıklı",
    "production",
    "development",
    "staging",
    "free",
    "pro",
    "business",
    "enterprise",
    "admin",
    "bearer",
    "authorization",
  ]) {
    truth.tokens.add(t);
  }

  return truth;
}

/**
 * Extract numeric literals from assistant text (skip code fences).
 */
function extractNumbersInText(text: string): string[] {
  const withoutCode = text.replace(/```[\s\S]*?```/g, " ");
  const found: string[] = [];
  const re = /(?<![A-Za-z_])(-?\d+(?:\.\d+)?)(?![A-Za-z_])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(withoutCode)) !== null) {
    found.push(m[1]);
  }
  return found;
}

/**
 * Returns null if OK, or a short reason if the answer drifts from tool facts.
 */
export function findGroundingViolation(
  text: string,
  packet: LlmContextPacket
): string | null {
  const truth = buildGroundTruth(packet);
  const hasLiveTools = packet.tools.some(
    (t) =>
      t.ok &&
      [
        "API_KEYS",
        "USAGE",
        "HEALTH",
        "LOGS",
        "ANALYTICS",
        "PROJECTS",
        "ORGANIZATIONS",
      ].includes(t.intent)
  );

  // If we have live inventory/metrics tools, every number must be whitelisted
  if (hasLiveTools) {
    for (const n of extractNumbersInText(text)) {
      if (truth.numbers.has(n)) continue;
      // Allow percentages already in truth; reject unknown large metrics
      const asNum = Number(n);
      if (!Number.isFinite(asNum)) continue;
      if (UNIVERSAL_NUMBERS.has(n)) continue;
      // Years like 2024-2026 sometimes appear in dates from logs — allow 20xx if in tool strings
      if (/^20\d{2}$/.test(n) && text.includes(n)) {
        const blob = JSON.stringify(packet.tools);
        if (blob.includes(n)) continue;
      }
      return `ungrounded_number:${n}`;
    }
  }

  // Invented key ids (key_...) must exist in tools
  const idRe = /\b(key_|org_|prj_)[A-Za-z0-9_-]{6,}\b/g;
  let idMatch: RegExpExecArray | null;
  while ((idMatch = idRe.exec(text)) !== null) {
    const id = idMatch[0];
    if (!truth.ids.has(id) && !JSON.stringify(packet.tools).includes(id)) {
      return `ungrounded_id:${id}`;
    }
  }

  // Full API secrets must never appear (sanitize also catches; belt+suspenders)
  if (/\bhl_(?:live|test)_[A-Za-z0-9]{12,}\b/.test(text)) {
    return "secret_leak";
  }

  return null;
}

/** True when the question is primarily asking for live counts / inventory. */
export function isStrictFactualQuery(packet: LlmContextPacket): boolean {
  const factual = new Set([
    "API_KEYS",
    "USAGE",
    "HEALTH",
    "LOGS",
    "ANALYTICS",
    "PROJECTS",
    "ORGANIZATIONS",
  ]);
  const soft = new Set([
    "DOCUMENTATION",
    "CODE_GENERATION",
    "INTEGRATIONS",
    "GENERAL",
    "UNKNOWN",
    "SECURITY",
  ]);
  const intents = packet.intents;
  if (!intents.length) return false;
  const hasFactual = intents.some((i) => factual.has(i));
  const onlySoft = intents.every((i) => soft.has(i));
  if (onlySoft) return false;
  return hasFactual;
}
