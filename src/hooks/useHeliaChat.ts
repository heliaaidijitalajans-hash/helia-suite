"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChatConversationSummary,
  ChatMessage,
  ChatSendPayload,
} from "@/components/chat";
import {
  fetchConversationMessages,
  fetchConversations,
  sendBrainMessage,
  renameConversation as renameConversationApi,
  deleteConversation as deleteConversationApi,
} from "@/services/brain";

export type UseHeliaChatOptions = {
  product?: "helia-suite" | "snapsell" | "crm" | "erp" | "mobile";
  autoLoad?: boolean;
};

export function useHeliaChat(options: UseHeliaChatOptions = {}) {
  const product = options.product ?? "helia-suite";
  const autoLoad = options.autoLoad ?? true;

  const [conversations, setConversations] = useState<ChatConversationSummary[]>(
    []
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const lastPayloadRef = useRef<ChatSendPayload | null>(null);

  const refreshConversations = useCallback(async () => {
    const items = await fetchConversations();
    setConversations(items);
    return items;
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    setError(null);
    setActiveConversationId(id);
    try {
      const next = await fetchConversationMessages(id);
      setMessages(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    }
  }, []);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    lastPayloadRef.current = null;
  }, []);

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      setError(null);
      try {
        await renameConversationApi(id, title);
        await refreshConversations();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to rename conversation"
        );
      }
    },
    [refreshConversations]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteConversationApi(id);
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setMessages([]);
        }
        await refreshConversations();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete conversation"
        );
      }
    },
    [activeConversationId, refreshConversations]
  );

  const sendMessage = useCallback(
    async (payload: ChatSendPayload) => {
      const content = payload.content.trim();
      if (!content) return;

      lastPayloadRef.current = payload;
      setError(null);
      setLoading(true);

      const optimisticUser: ChatMessage = {
        id: `local-user-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser]);

      try {
        const result = await sendBrainMessage({
          content,
          conversationId: payload.conversationId,
          product,
        });

        setActiveConversationId(result.conversation.id);
        setMessages(result.conversation.messages);
        await refreshConversations();
        lastPayloadRef.current = null;
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setLoading(false);
      }
    },
    [product, refreshConversations]
  );

  const retry = useCallback(async () => {
    const payload = lastPayloadRef.current;
    if (!payload) return;
    await sendMessage(payload);
  }, [sendMessage]);

  useEffect(() => {
    if (!autoLoad) return;
    let cancelled = false;
    (async () => {
      setHydrating(true);
      try {
        const { ensureWorkspace } = await import("@/services/cloud");
        await ensureWorkspace();
        const items = await fetchConversations();
        if (!cancelled) setConversations(items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load chat history"
          );
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoLoad]);

  return {
    conversations,
    activeConversationId,
    messages,
    /** True while waiting for a Brain response (TypingIndicator). */
    loading,
    /** True while conversation history is first loading. */
    hydrating,
    error,
    sendMessage,
    selectConversation,
    startNewChat,
    renameConversation,
    deleteConversation,
    retry,
    refreshConversations,
    clearError: () => setError(null),
  };
}
