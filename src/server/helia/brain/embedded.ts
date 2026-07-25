/**
 * Embedded Helia Brain ask — runs in-process inside Next.js (no :4090).
 * Preserves the BrainAnswer contract used by Helia Chat.
 */

import { createId } from "@/server/helia/utils/id";
import type {
  BrainAnswer,
  BrainAskRequestBody,
  BrainAskResult,
  BrainConversationSession,
  BrainStreamHandlers,
} from "@/lib/api/brain-types";

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

  const summary =
    `Helia received: “${body.text.trim()}”. ` +
    `This Suite deployment runs Helia Cloud + Brain routes in-process on your Vercel domain ` +
    `(no separate :4090/:4091 services). ` +
    `Operational telemetry from Inspector subsystems is limited in this embedded mode; ` +
    `connect product context via Organizations and API Keys in the dashboard.`;

  const answer: BrainAnswer = {
    id: answerId,
    conversationId: session.id,
    questionId,
    intent: "unknown",
    askedAt,
    answeredAt,
    resolvedQuestion: body.text.trim(),
    summary,
    reasoning:
      "Embedded Helia Brain preserves the Suite chat contract while Cloud APIs run inside Next.js.",
    evidence: [
      {
        source: "conversation",
        reference: session.id,
        detail: "In-process Helia Suite Brain session",
        observedAt: answeredAt,
      },
    ],
    confidence: 0.55,
    recommendedAction:
      "Use Organizations and API Keys for tenant context; ask follow-ups in this thread.",
    businessImpact: "Chat remains available on a single Vercel deployment domain.",
    technicalImpact:
      "No localhost Cloud/Inspector ports; browser calls same-origin /api/brain/* only.",
    insufficientData: true,
    suggestedFollowUps: [
      "What organizations do I have?",
      "How do I create an API key?",
      "Show my current usage.",
    ],
    personality: "professional_calm_sre",
  };

  session.turns.push({
    questionId,
    question: body.text.trim(),
    resolvedQuestion: body.text.trim(),
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
