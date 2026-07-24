/**
 * Low-level Helia Brain HTTP client (server-side).
 * Streaming-ready: sync today; onChunk reserved for future SSE/token streams.
 */

export type BrainAskRequestBody = {
  text: string;
  conversationId?: string;
  adminId?: string;
};

export type BrainEvidence = {
  source: string;
  reference: string;
  detail: string;
  observedAt?: string;
};

export type BrainAnswer = {
  id: string;
  conversationId: string;
  questionId: string;
  intent: string;
  askedAt: string;
  answeredAt: string;
  resolvedQuestion: string;
  summary: string;
  reasoning: string;
  evidence: BrainEvidence[];
  confidence: number;
  recommendedAction: string;
  businessImpact: string;
  technicalImpact: string;
  insufficientData: boolean;
  suggestedFollowUps: string[];
  personality: string;
};

export type BrainConversationTurn = {
  questionId: string;
  question: string;
  resolvedQuestion: string;
  intent: string;
  answerId: string;
  summary: string;
  askedAt: string;
  topics: string[];
  entities: string[];
};

export type BrainConversationSession = {
  id: string;
  adminId?: string;
  createdAt: string;
  updatedAt: string;
  turns: BrainConversationTurn[];
};

export type BrainAskResult = {
  ok: true;
  answer: BrainAnswer;
};

export type BrainStreamHandlers = {
  /** Invoked for each streamed chunk when Brain supports streaming. */
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
};

function brainBaseUrl(): string {
  return (
    process.env.HELIA_BRAIN_URL?.replace(/\/$/, "") ||
    process.env.HELIA_INSPECTOR_URL?.replace(/\/$/, "") ||
    "http://localhost:4090"
  );
}

function brainAdminToken(): string {
  const token =
    process.env.HELIA_BRAIN_ADMIN_TOKEN ||
    process.env.HELIA_INSPECTOR_ADMIN_TOKEN ||
    "";
  if (!token) {
    throw new Error(
      "Missing HELIA_BRAIN_ADMIN_TOKEN (or HELIA_INSPECTOR_ADMIN_TOKEN)"
    );
  }
  return token;
}

async function brainFetch<T>(
  path: string,
  init?: RequestInit & { signal?: AbortSignal }
): Promise<T> {
  const res = await fetch(`${brainBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${brainAdminToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    signal: init?.signal,
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: { message?: string }; answer?: BrainAnswer }
    | null;

  if (!res.ok || !data?.ok) {
    const message =
      data?.error?.message || `Helia Brain request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

/**
 * Ask Helia Brain. Architecture is streaming-ready: when the upstream adds
 * SSE/token streams, wire them here without changing chat UI components.
 */
export async function askBrain(
  body: BrainAskRequestBody,
  handlers: BrainStreamHandlers = {}
): Promise<BrainAskResult> {
  const result = await brainFetch<BrainAskResult>("/brain/ask", {
    method: "POST",
    body: JSON.stringify(body),
    signal: handlers.signal,
  });

  // Sync fallback that keeps a future stream contract stable for callers.
  handlers.onChunk?.(result.answer.summary);

  return result;
}

export async function listBrainConversations(
  limit = 50
): Promise<{ ok: true; items: BrainConversationSession[] }> {
  return brainFetch(`/brain/conversations?limit=${limit}`);
}

export async function getBrainConversation(
  id: string
): Promise<{ ok: true; conversation: BrainConversationSession }> {
  return brainFetch(`/brain/conversations/${encodeURIComponent(id)}`);
}

export async function clearBrainConversation(
  id: string
): Promise<{ ok: true; cleared: boolean }> {
  return brainFetch(`/brain/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
