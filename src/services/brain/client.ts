/**
 * Browser-facing Brain service — calls Suite BFF only (no secrets, no direct Brain fetch).
 */

import type { ChatConversationSummary, ChatMessage } from "@/components/chat";
import type { AskBrainServiceResult, BrainClientError } from "./types";

export type BrainAskClientPayload = {
  content: string;
  conversationId: string | null;
  product?: "helia-suite" | "snapsell" | "crm" | "erp" | "mobile";
};

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as
    | (T & { ok?: boolean; error?: BrainClientError })
    | null;

  if (!res.ok || !data || data.ok === false) {
    const message =
      (data as { error?: BrainClientError } | null)?.error?.message ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export async function fetchConversations(): Promise<ChatConversationSummary[]> {
  const res = await fetch("/api/brain/conversations", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = await parseJson<{
    ok: true;
    items: ChatConversationSummary[];
  }>(res);
  return data.items;
}

export async function fetchConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  const res = await fetch(
    `/api/brain/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );
  const data = await parseJson<{
    ok: true;
    messages: ChatMessage[];
  }>(res);
  return data.messages;
}

export async function sendBrainMessage(
  payload: BrainAskClientPayload
): Promise<AskBrainServiceResult> {
  const res = await fetch("/api/brain/ask", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ ok: true } & AskBrainServiceResult>(res);
  return {
    conversation: data.conversation,
    userMessage: data.userMessage,
    assistantMessage: data.assistantMessage,
  };
}
