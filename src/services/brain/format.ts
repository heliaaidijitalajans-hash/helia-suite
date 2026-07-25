import type { ChatMessage } from "@/components/chat";
import type { BrainAnswer } from "@/lib/api/brain-types";

export function createLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

export function titleFromContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 42) return trimmed;
  return `${trimmed.slice(0, 42).trim()}…`;
}

/** Map Helia Brain structured answer → chat bubble text (UI-stable). */
export function formatBrainAnswerContent(answer: BrainAnswer): string {
  if (answer.insufficientData) {
    const summary = answer.summary.trim();
    return summary || "I don't have enough information.";
  }
  const parts = [answer.summary.trim()];
  if (answer.recommendedAction?.trim()) {
    parts.push(`Recommended action: ${answer.recommendedAction.trim()}`);
  }
  return parts.join("\n\n");
}

export function toAssistantMessage(answer: BrainAnswer): ChatMessage {
  return {
    id: answer.id || createLocalId("msg"),
    role: "assistant",
    content: formatBrainAnswerContent(answer),
    createdAt: answer.answeredAt || new Date().toISOString(),
  };
}

export function toUserMessage(content: string): ChatMessage {
  return {
    id: createLocalId("msg"),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };
}
