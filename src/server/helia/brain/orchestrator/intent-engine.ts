/**
 * Semantic Intent Engine.
 * Classifies messages via token/feature overlap — not full-sentence switches.
 * Supports multi-intent and conversation-memory boosts for follow-ups.
 */

import type { ConversationMemory, HeliaIntent, IntentScore } from "./types";

const INTENT_FEATURES: Record<HeliaIntent, string[]> = {
  API_KEYS: [
    "api",
    "key",
    "keys",
    "apikey",
    "apikeys",
    "token",
    "credential",
    "rotate",
    "disable",
    "permission",
    "capability",
    "bearer",
    "hl_live",
    "hl_test",
    "secret",
    "prefix",
    "whoami",
  ],
  PROJECTS: [
    "project",
    "projects",
    "workspace",
    "environment",
    "staging",
    "production",
    "development",
  ],
  ORGANIZATIONS: [
    "organization",
    "organizations",
    "org",
    "orgs",
    "tenant",
    "company",
    "workspace",
    "plan",
  ],
  USAGE: [
    "usage",
    "request",
    "requests",
    "quota",
    "consume",
    "consumption",
    "today",
    "monthly",
    "bandwidth",
    "brain",
    "monitoring",
  ],
  HEALTH: [
    "health",
    "healthy",
    "status",
    "uptime",
    "degraded",
    "alive",
    "heartbeat",
    "platform",
    "system",
  ],
  LOGS: [
    "log",
    "logs",
    "error",
    "errors",
    "audit",
    "trace",
    "failure",
    "exception",
    "incident",
  ],
  DOCUMENTATION: [
    "doc",
    "docs",
    "documentation",
    "guide",
    "reference",
    "explain",
    "how",
    "endpoint",
    "rest",
    "webhook",
    "auth",
    "authentication",
  ],
  INTEGRATIONS: [
    "integration",
    "integrations",
    "zapier",
    "n8n",
    "make",
    "webhook",
    "connect",
    "sdk",
  ],
  ANALYTICS: [
    "analytics",
    "metric",
    "metrics",
    "series",
    "trend",
    "top",
    "chart",
    "rate",
    "errorrate",
  ],
  CODE_GENERATION: [
    "code",
    "example",
    "snippet",
    "generate",
    "sample",
    "typescript",
    "javascript",
    "python",
    "php",
    "curl",
    "golang",
    "csharp",
    "java",
    "node",
    "nextjs",
    "react",
    "vue",
    "angular",
  ],
  SECURITY: [
    "env",
    "secret",
    "secrets",
    "password",
    "jwt",
    "dump",
    "shell",
    "terminal",
    "filesystem",
    "promote",
    "database",
    "credential",
    "cookie",
  ],
  GENERAL: [
    "help",
    "hello",
    "hi",
    "thanks",
    "administrator",
    "what",
    "can",
    "you",
    "do",
  ],
  UNKNOWN: [],
};

const FOLLOW_UP_CUES = [
  "it",
  "them",
  "that",
  "those",
  "this",
  "these",
  "newest",
  "latest",
  "same",
  "again",
  "also",
  "and",
  "rotate",
  "disable",
  "delete",
  "one",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function scoreIntent(tokens: Set<string>, intent: HeliaIntent): number {
  const features = INTENT_FEATURES[intent];
  if (!features.length) return 0;
  let hits = 0;
  let weight = 0;
  for (const feature of features) {
    if (tokens.has(feature)) {
      hits += 1;
      weight += feature.length > 6 ? 1.4 : 1;
    }
    // soft stem: keys ↔ key
    if (feature.endsWith("s") && tokens.has(feature.slice(0, -1))) {
      hits += 0.7;
      weight += 0.7;
    }
  }
  if (hits === 0) return 0;
  return weight / Math.sqrt(features.length);
}

/**
 * Semantic multi-label classification.
 * Returns intents above threshold, optionally boosted by memory follow-ups.
 */
export function detectIntents(
  message: string,
  memory: ConversationMemory
): HeliaIntent[] {
  const tokens = new Set(tokenize(message));
  const scores: IntentScore[] = (
    Object.keys(INTENT_FEATURES) as HeliaIntent[]
  )
    .filter((i) => i !== "UNKNOWN")
    .map((intent) => ({
      intent,
      score: scoreIntent(tokens, intent),
    }))
    .sort((a, b) => b.score - a.score);

  const followUp =
    tokens.size <= 8 &&
    [...tokens].some((t) => FOLLOW_UP_CUES.includes(t)) &&
    memory.lastIntents.length > 0;

  if (followUp) {
    for (const prev of memory.lastIntents) {
      const row = scores.find((s) => s.intent === prev);
      if (row) row.score += 1.25;
    }
    // “newest one” after API keys
    if (
      (tokens.has("newest") || tokens.has("latest") || tokens.has("one")) &&
      memory.lastIntents.includes("API_KEYS")
    ) {
      const row = scores.find((s) => s.intent === "API_KEYS");
      if (row) row.score += 1.5;
    }
  }

  scores.sort((a, b) => b.score - a.score);

  const threshold = 0.35;
  const selected = scores
    .filter((s) => s.score >= threshold)
    .slice(0, 4)
    .map((s) => s.intent);

  if (selected.length === 0) {
    // Soft documentation / general assist — never hard-fail to UNKNOWN alone
    if (tokens.has("how") || tokens.has("what") || tokens.has("explain")) {
      return ["DOCUMENTATION"];
    }
    return ["GENERAL"];
  }

  // Drop GENERAL if stronger domain intents exist
  if (selected.length > 1 && selected.includes("GENERAL")) {
    return selected.filter((i) => i !== "GENERAL");
  }

  return selected;
}
