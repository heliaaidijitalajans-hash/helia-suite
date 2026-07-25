/**
 * Shared Brain types (safe for client + server imports).
 */

export type BrainAskRequestBody = {
  text: string;
  conversationId?: string;
  adminId?: string;
  recentMessages?: Array<{ role: "user" | "assistant"; content: string }>;
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
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
};
