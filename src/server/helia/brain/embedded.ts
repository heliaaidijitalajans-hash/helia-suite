/**
 * Embedded Helia Brain ask — runs in-process inside Next.js (no :4090).
 * Preserves the BrainAnswer contract used by Helia Chat.
 * Prefer real platform facts for Admin Console questions.
 */

import { createId } from "@/server/helia/utils/id";
import type {
  BrainAnswer,
  BrainAskRequestBody,
  BrainAskResult,
  BrainConversationSession,
  BrainStreamHandlers,
} from "@/lib/api/brain-types";
import {
  answerFromPlatformData,
  INSUFFICIENT_DATA_MESSAGE,
} from "./platform-context";

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
  body: BrainAskRequestBody,
  handlers: BrainStreamHandlers = {}
): Promise<BrainAskResult> {
  const askedAt = new Date().toISOString();
  const session = ensureSession(body.conversationId, body.adminId);
  const questionId = createId("brainq");
  const answerId = createId("brainans");
  const answeredAt = new Date().toISOString();
  const text = body.text.trim();

  let answer: BrainAnswer;
  try {
    const platform = await answerFromPlatformData(text);
    if (platform) {
      answer = {
        id: answerId,
        conversationId: session.id,
        questionId,
        intent: platform.intent,
        askedAt,
        answeredAt,
        resolvedQuestion: text,
        summary: platform.summary,
        reasoning: platform.insufficientData
          ? "No matching platform telemetry was available for this question."
          : "Answered from live Helia Cloud admin platform data.",
        evidence: platform.evidence,
        confidence: platform.confidence,
        recommendedAction: platform.recommendedAction ?? "",
        businessImpact: platform.insufficientData
          ? "Cannot advise without observed data."
          : "Operators can act on observed platform metrics.",
        technicalImpact: platform.insufficientData
          ? "Missing metric or empty store."
          : "Values read from embedded Cloud stores.",
        insufficientData: platform.insufficientData,
        suggestedFollowUps: [
          "Show today's API usage",
          "How many active API Keys exist?",
          "Is the platform healthy?",
        ],
        personality: "professional_calm_sre",
      };
    } else {
      answer = {
        id: answerId,
        conversationId: session.id,
        questionId,
        intent: "unknown",
        askedAt,
        answeredAt,
        resolvedQuestion: text,
        summary: INSUFFICIENT_DATA_MESSAGE,
        reasoning:
          "No platform intent matched and no fabricated answer is allowed.",
        evidence: [
          {
            source: "conversation",
            reference: session.id,
            detail: "Unmatched question against platform data intents",
            observedAt: answeredAt,
          },
        ],
        confidence: 1,
        recommendedAction:
          "Ask about usage, errors, API keys, health, or today's activity.",
        businessImpact: "No action without verified data.",
        technicalImpact: "Intent router returned no platform match.",
        insufficientData: true,
        suggestedFollowUps: [
          "Show today's API usage",
          "List recent errors",
          "Is the platform healthy?",
        ],
        personality: "professional_calm_sre",
      };
    }
  } catch {
    answer = {
      id: answerId,
      conversationId: session.id,
      questionId,
      intent: "error",
      askedAt,
      answeredAt,
      resolvedQuestion: text,
      summary: INSUFFICIENT_DATA_MESSAGE,
      reasoning: "Platform data lookup failed.",
      evidence: [
        {
          source: "platform",
          reference: "lookup",
          detail: "Exception while reading admin platform data",
          observedAt: answeredAt,
        },
      ],
      confidence: 1,
      recommendedAction: "Retry shortly or check Admin → System Health.",
      businessImpact: "Cannot answer until platform data is readable.",
      technicalImpact: "Embedded Brain platform-context error.",
      insufficientData: true,
      suggestedFollowUps: ["Is the platform healthy?"],
      personality: "professional_calm_sre",
    };
  }

  session.turns.push({
    questionId,
    question: text,
    resolvedQuestion: text,
    intent: answer.intent,
    answerId,
    summary: answer.summary,
    askedAt,
    topics: [],
    entities: [],
  });
  session.updatedAt = answeredAt;
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
