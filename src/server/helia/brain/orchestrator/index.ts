/**
 * Helia AI Orchestrator
 *
 * User → Conversation Context → Intent Detection → Tool Router
 *   → Platform Service(s) → Context Builder → LLM → Response
 *
 * The LLM never decides platform facts; it only formats tool JSON.
 */

import { createId } from "@/server/helia/utils/id";
import type { BrainAnswer } from "@/lib/api/brain-types";
import { buildLlmContext } from "./context-builder";
import { detectIntents } from "./intent-engine";
import { detectReplyLanguage } from "./language";
import { formatWithLlm } from "./llm";
import {
  getConversationMemory,
  rememberAssistantTurn,
  rememberUserTurn,
} from "./memory";
import { routeTools } from "./tool-router";
import type { OrchestratorInput, OrchestratorOutput } from "./types";

export async function runHeliaOrchestrator(
  input: OrchestratorInput
): Promise<OrchestratorOutput> {
  const memory = getConversationMemory(input.conversationId, input.userId);

  if (input.recentMessages?.length) {
    // Seed memory from persisted history when cold
    if (memory.turns.length === 0) {
      for (const m of input.recentMessages.slice(-12)) {
        memory.turns.push({
          role: m.role,
          content: m.content,
          at: new Date().toISOString(),
        });
      }
    }
  }

  rememberUserTurn(memory, input.text);

  const intents = detectIntents(input.text, memory);
  const toolResults = await routeTools(
    intents,
    input.userId,
    input.text,
    memory
  );

  const packet = buildLlmContext({
    userMessage: input.text,
    intents,
    memory,
    toolResults,
  });

  const { text, mode } = await formatWithLlm(packet);

  const payloads: Record<string, unknown> = {};
  for (const r of toolResults) {
    payloads[r.tool] = r.data;
  }
  rememberAssistantTurn(memory, text, intents, payloads);

  return {
    intents,
    toolResults,
    formattedText: text,
    reasoning: `orchestrator intents=${intents.join(",")} tools=${toolResults
      .map((t) => t.tool)
      .join("+")} llm=${mode} lang=${packet.replyLanguage}`,
    insufficientData: false,
  };
}

export async function orchestrateBrainAnswer(input: {
  text: string;
  conversationId: string;
  userId: string;
  questionId?: string;
  answerId?: string;
  recentMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<BrainAnswer> {
  const askedAt = new Date().toISOString();
  const result = await runHeliaOrchestrator({
    text: input.text,
    conversationId: input.conversationId,
    userId: input.userId,
    recentMessages: input.recentMessages,
  });
  const answeredAt = new Date().toISOString();

  return {
    id: input.answerId || createId("brainans"),
    conversationId: input.conversationId,
    questionId: input.questionId || createId("brainq"),
    intent: result.intents.join("+") || "GENERAL",
    askedAt,
    answeredAt,
    resolvedQuestion: input.text.trim(),
    summary: result.formattedText,
    reasoning: result.reasoning,
    evidence: result.toolResults.map((t) => ({
      source: t.tool,
      reference: t.intent,
      detail: t.ok ? "structured_json" : t.error || "error",
      observedAt: answeredAt,
    })),
    confidence: 0.95,
    recommendedAction: "",
    businessImpact: "",
    technicalImpact: "",
    insufficientData: result.insufficientData,
    suggestedFollowUps:
      detectReplyLanguage(input.text) === "tr"
        ? [
            "Kaç API anahtarım var?",
            "Bugünkü kullanımı göster",
            "Platform sağlıklı mı?",
          ]
        : [
            "How many API Keys do I have?",
            "Show today's usage",
            "Is the platform healthy?",
          ],
    personality: "professional_calm_sre",
  };
}
