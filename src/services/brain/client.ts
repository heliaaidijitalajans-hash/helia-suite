/**
 * Browser-facing Brain service — calls Suite BFF only (no secrets, no direct Brain fetch).
 */

import type { ChatConversationSummary, ChatMessage } from "@/components/chat";
import { getHeliaAccessToken } from "@/lib/cloud/session";
import type { AskBrainServiceResult, BrainClientError } from "./types";

export type BrainAskClientPayload = {
  content: string;
  conversationId: string | null;
  product?: "helia-suite" | "snapsell" | "crm" | "erp" | "mobile";
};

function brainHeaders(json = false): HeadersInit {
  const token = getHeliaAccessToken();
  return {
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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
    headers: brainHeaders(),
    credentials: "same-origin",
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
      headers: brainHeaders(),
      credentials: "same-origin",
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
    headers: brainHeaders(true),
    credentials: "same-origin",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await parseJson<{ ok: true } & AskBrainServiceResult>(res);
  return {
    conversation: data.conversation,
    userMessage: data.userMessage,
    assistantMessage: data.assistantMessage,
  };
}

export async function renameConversation(
  conversationId: string,
  title: string
): Promise<ChatConversationSummary> {
  const res = await fetch(
    `/api/brain/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: "PATCH",
      headers: brainHeaders(true),
      credentials: "same-origin",
      body: JSON.stringify({ title }),
      cache: "no-store",
    }
  );
  const data = await parseJson<{
    ok: true;
    conversation: ChatConversationSummary;
  }>(res);
  return data.conversation;
}

export async function deleteConversation(
  conversationId: string
): Promise<void> {
  const res = await fetch(
    `/api/brain/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: "DELETE",
      headers: brainHeaders(),
      credentials: "same-origin",
      cache: "no-store",
    }
  );
  await parseJson<{ ok: true; deleted: boolean }>(res);
}
