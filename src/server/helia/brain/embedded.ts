/**
 * Embedded Helia Brain — delegates to the AI Orchestrator.
 * Flow: context → intent → tools → structured JSON → LLM format.
 */

import { createId } from "@/server/helia/utils/id";
import type {
  BrainAskRequestBody,
  BrainAskResult,
  BrainConversationSession,
  BrainStreamHandlers,
} from "@/lib/api/brain-types";
import { orchestrateBrainAnswer } from "./orchestrator";

type MemoryStore = {
  sessions: Map<string, BrainConversationSession>;
};

declare global {
  // eslint-disable-next-line no-var
  var __heliaEmbeddedBrain: MemoryStore | undefined;
}

function store(): MemoryStore {
  if (!globalThis.__heliaEmbeddedBrain) {
    globalThis.__heliaEmbeddedBrain = { sessions: new Map() };
  }
  return globalThis.__heliaEmbeddedBrain;
}

export function getEmbeddedBrainHealth(): boolean {
  try {
    store();
    return true;
  } catch {
    return false;
  }
}

function ensureSession(
  conversationId: string | undefined,
  adminId?: string
): BrainConversationSession {
  const id = conversationId || createId("brainconv");
  const existing = store().sessions.get(id);
  if (existing) return existing;
  const now = new Date().toISOString();
  const session: BrainConversationSession = {
    id,
    ...(adminId ? { adminId } : {}),
    createdAt: now,
    updatedAt: now,
    turns: [],
  };
  store().sessions.set(id, session);
  return session;
}

export async function askBrainEmbedded(
  body: BrainAskRequestBody & {
    recentMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  },
  handlers: BrainStreamHandlers = {}
): Promise<BrainAskResult> {
  const session = ensureSession(body.conversationId, body.adminId);
  const questionId = createId("brainq");
  const answerId = createId("brainans");
  const text = body.text.trim();

  const answer = await orchestrateBrainAnswer({
    text,
    conversationId: session.id,
    userId: body.adminId || "unknown",
    questionId,
    answerId,
    recentMessages: body.recentMessages,
  });

  session.turns.push({
    questionId,
    question: text,
    resolvedQuestion: text,
    intent: answer.intent,
    answerId,
    summary: answer.summary,
    askedAt: answer.askedAt,
    topics: [],
    entities: [],
  });
  session.updatedAt = answer.answeredAt;
  store().sessions.set(session.id, session);

  handlers.onChunk?.(answer.summary);
  return { ok: true, answer };
}

export function listBrainConversationsEmbedded(limit = 50): {
  ok: true;
  items: BrainConversationSession[];
} {
  const items = [...store().sessions.values()]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, limit);
  return { ok: true, items };
}

export function getBrainConversationEmbedded(id: string): {
  ok: true;
  conversation: BrainConversationSession;
} | null {
  const session = store().sessions.get(id);
  if (!session) return null;
  return { ok: true, conversation: session };
}

export function clearBrainConversationEmbedded(id: string): {
  ok: true;
  cleared: boolean;
} {
  return { ok: true, cleared: store().sessions.delete(id) };
}
