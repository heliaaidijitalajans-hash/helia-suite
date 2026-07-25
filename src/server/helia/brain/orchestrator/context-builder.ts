/**
 * Context Builder — packs tool JSON + memory for the LLM formatter.
 * The LLM must never invent fields missing from this payload.
 */

import type { ConversationMemory, ToolResult } from "./types";
import { detectReplyLanguage, type ReplyLanguage } from "./language";

export type LlmContextPacket = {
  userMessage: string;
  replyLanguage: ReplyLanguage;
  intents: string[];
  memory: {
    lastIntents: string[];
    newestApiKeyId?: string;
    recentTurns: Array<{ role: string; content: string }>;
  };
  tools: Array<{
    tool: string;
    intent: string;
    ok: boolean;
    data: Record<string, unknown>;
    error?: string;
  }>;
  rules: string[];
};

export function buildLlmContext(input: {
  userMessage: string;
  intents: string[];
  memory: ConversationMemory;
  toolResults: ToolResult[];
}): LlmContextPacket {
  const replyLanguage = detectReplyLanguage(input.userMessage);
  return {
    userMessage: input.userMessage,
    replyLanguage,
    intents: input.intents,
    memory: {
      lastIntents: input.memory.lastIntents,
      ...(input.memory.entities.newestApiKeyId
        ? { newestApiKeyId: input.memory.entities.newestApiKeyId }
        : {}),
      recentTurns: input.memory.turns.slice(-8).map((t) => ({
        role: t.role,
        content: t.content.slice(0, 500),
      })),
    },
    tools: input.toolResults.map((r) => ({
      tool: r.tool,
      intent: r.intent,
      ok: r.ok,
      data: r.data,
      ...(r.error ? { error: r.error } : {}),
    })),
    rules: [
      "Use ONLY numbers and facts present in tools[].data.",
      "Never invent platform metrics.",
      "If a tool returns empty collections, report zero / empty — that is valid live data.",
      "For follow-ups like 'the newest one' / 'yenisini', use memory.newestApiKeyId and tools API key lists.",
      "Format professionally with Status/Summary (EN) or Durum/Özet (TR).",
      `Reply language must be: ${replyLanguage === "tr" ? "Turkish" : "English"}.`,
      "If tools are documentation/general, answer as Helia documentation assistant.",
    ],
  };
}
