/**
 * Conversation memory for anaphora (“the newest one”) and multi-turn tool context.
 */

import type { ConversationMemory, HeliaIntent } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __heliaOrchestratorMemory: Map<string, ConversationMemory> | undefined;
}

function store(): Map<string, ConversationMemory> {
  if (!globalThis.__heliaOrchestratorMemory) {
    globalThis.__heliaOrchestratorMemory = new Map();
  }
  return globalThis.__heliaOrchestratorMemory;
}

export function getConversationMemory(
  conversationId: string,
  userId: string
): ConversationMemory {
  const key = `${userId}:${conversationId}`;
  const existing = store().get(key);
  if (existing) return existing;
  const fresh: ConversationMemory = {
    conversationId,
    userId,
    turns: [],
    lastIntents: [],
    entities: {},
    lastToolPayloads: {},
  };
  store().set(key, fresh);
  return fresh;
}

export function rememberUserTurn(memory: ConversationMemory, content: string) {
  memory.turns.push({
    role: "user",
    content,
    at: new Date().toISOString(),
  });
  if (memory.turns.length > 40) {
    memory.turns = memory.turns.slice(-40);
  }
}

export function rememberAssistantTurn(
  memory: ConversationMemory,
  content: string,
  intents: HeliaIntent[],
  payloads: Record<string, unknown>
) {
  memory.turns.push({
    role: "assistant",
    content,
    at: new Date().toISOString(),
  });
  memory.lastIntents = intents;
  memory.lastToolPayloads = payloads;
  if (memory.turns.length > 40) {
    memory.turns = memory.turns.slice(-40);
  }
}

export function clearConversationMemory(
  conversationId: string,
  userId: string
) {
  store().delete(`${userId}:${conversationId}`);
}
