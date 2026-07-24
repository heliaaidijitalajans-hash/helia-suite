import type { ChatMessage } from "@/components/chat";

export type BrainScope = {
  organizationId: string;
  projectId: string;
  userId: string;
};

export type PersistedConversation = {
  id: string;
  organizationId: string;
  projectId: string;
  userId: string;
  title: string;
  preview?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  /** Product surface this conversation serves (future multi-app). */
  product?: "helia-suite" | "snapsell" | "crm" | "erp" | "mobile";
};

export type AskBrainServiceInput = {
  content: string;
  conversationId: string | null;
  product?: PersistedConversation["product"];
};

export type AskBrainServiceResult = {
  conversation: PersistedConversation;
  assistantMessage: ChatMessage;
  userMessage: ChatMessage;
};

export type BrainClientError = {
  message: string;
  code?: string;
};
