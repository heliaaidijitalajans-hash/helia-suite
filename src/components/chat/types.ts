/**
 * Shared chat types — shaped for a future Helia Cloud Brain API
 * without coupling the UI to any network layer today.
 */

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  updatedAt?: string;
  preview?: string;
};

/** Payload ready to POST to Helia Cloud Brain later. */
export type ChatSendPayload = {
  conversationId: string | null;
  content: string;
};
