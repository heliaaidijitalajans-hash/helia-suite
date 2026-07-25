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
  const summary = answer.summary.trim();
  if (!summary) {
    return "No live data available.";
  }
  // Pass through conversational / already-formatted assistant text as-is.
  if (
    summary.includes("blocked by the Helia security policy") ||
    summary.includes("Helia güvenlik politikası") ||
    summary === "No documentation found." ||
    summary === "Dokümantasyon bulunamadı." ||
    summary === "No live data available."
  ) {
    return summary;
  }
  if (answer.insufficientData) {
    return summary;
  }
  // Do not re-wrap with Recommendation labels — answers are GPT-style prose.
  return summary;
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
