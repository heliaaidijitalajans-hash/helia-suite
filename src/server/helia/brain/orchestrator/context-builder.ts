/**
 * Context Builder — packs tool JSON + memory for the conversational LLM.
 * The model must never invent fields missing from this payload.
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
    recentTurns: Array<{ role: "user" | "assistant"; content: string }>;
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
      recentTurns: input.memory.turns.slice(-12).map((t) => ({
        role: t.role,
        content: t.content.slice(0, 1200),
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
      "Answer like a capable ChatGPT-style assistant specialized in Helia Suite.",
      "Use ONLY facts present in tools[].data for live metrics and inventory.",
      "Never invent platform numbers, names, or statuses.",
      "Empty collections mean zero live records — say so clearly.",
      "Use conversation history for pronouns and follow-ups (e.g. 'the newest one' / 'yenisini').",
      "Prefer natural prose; bullets only when helpful.",
      `Reply language must be: ${replyLanguage === "tr" ? "Turkish" : "English"}.`,
      "Do not dump raw JSON unless the user explicitly asks for JSON.",
    ],
  };
}
