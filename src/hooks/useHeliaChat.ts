"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const ACTIVE_KEY = "helia_admin_chat_active_id";

function detectClientLang(text: string): "tr" | "en" {
  if (/[çğıöşüÇĞİÖŞÜ]/.test(text)) return "tr";
  if (
    /\b(kaç|nedir|nasıl|göster|proje|organizasyon|anahtar|kullanım|sağlık|hata|merhaba)\b/i.test(
      text
    )
  ) {
    return "tr";
  }
  return "en";
}

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

  const thinkingLanguage = useMemo(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return detectClientLang(lastUser?.content || "");
  }, [messages]);

  const persistActiveId = useCallback((id: string | null) => {
    if (typeof window === "undefined") return;
    if (id) window.sessionStorage.setItem(ACTIVE_KEY, id);
    else window.sessionStorage.removeItem(ACTIVE_KEY);
  }, []);

  const refreshConversations = useCallback(async () => {
    const items = await fetchConversations();
    setConversations(items);
    return items;
  }, []);

  const selectConversation = useCallback(
    async (id: string) => {
      setError(null);
      setActiveConversationId(id);
      persistActiveId(id);
      try {
        const next = await fetchConversationMessages(id);
        setMessages(next);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load conversation"
        );
      }
    },
    [persistActiveId]
  );

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    lastPayloadRef.current = null;
    persistActiveId(null);
  }, [persistActiveId]);

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
          persistActiveId(null);
        }
        await refreshConversations();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete conversation"
        );
      }
    },
    [activeConversationId, persistActiveId, refreshConversations]
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
        persistActiveId(result.conversation.id);
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
    [persistActiveId, product, refreshConversations]
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
        if (cancelled) return;
        setConversations(items);

        const saved =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(ACTIVE_KEY)
            : null;
        const restoreId =
          (saved && items.some((i) => i.id === saved) && saved) ||
          items[0]?.id ||
          null;

        if (restoreId) {
          setActiveConversationId(restoreId);
          persistActiveId(restoreId);
          const next = await fetchConversationMessages(restoreId);
          if (!cancelled) setMessages(next);
        }
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
  }, [autoLoad, persistActiveId]);

  return {
    conversations,
    activeConversationId,
    messages,
    loading,
    thinkingLanguage,
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
