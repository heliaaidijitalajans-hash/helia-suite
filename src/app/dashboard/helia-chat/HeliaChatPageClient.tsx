/**
 * Helia Chat — shared client surface.
 * Mounted from Admin Panel (/admin/chat). Customer dashboard redirects away.
 */

"use client";

import { ChatLayout } from "@/components/chat";
import { useHeliaChat } from "@/hooks/useHeliaChat";

export default function HeliaChatPageClient({
  intro,
  emptyTitle,
  emptyDescription,
}: {
  intro?: string;
  emptyTitle?: string;
  emptyDescription?: string;
} = {}) {
  const {
    conversations,
    activeConversationId,
    messages,
    loading,
    thinkingLanguage,
    error,
    sendMessage,
    selectConversation,
    startNewChat,
    renameConversation,
    deleteConversation,
    retry,
  } = useHeliaChat({ product: "helia-suite" });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {intro ? (
        <p className="text-sm leading-relaxed text-white/50">{intro}</p>
      ) : null}

      {error ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => void retry()}
            className="shrink-0 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/85 transition-colors hover:bg-white/[0.1]"
          >
            Retry
          </button>
        </div>
      ) : null}

      <ChatLayout
        conversations={conversations}
        activeConversationId={activeConversationId}
        messages={messages}
        loading={loading}
        thinkingLanguage={thinkingLanguage}
        onSelectConversation={(id) => void selectConversation(id)}
        onNewChat={startNewChat}
        onSend={(payload) => void sendMessage(payload)}
        onRenameConversation={(id, title) => void renameConversation(id, title)}
        onDeleteConversation={(id) => void deleteConversation(id)}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </div>
  );
}
