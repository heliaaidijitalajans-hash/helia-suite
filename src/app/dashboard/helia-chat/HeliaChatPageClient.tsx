/**
 * Preserved customer-dashboard Helia Chat page (unused).
 * Route /dashboard/helia-chat redirects to Overview.
 * Mount this client page from the Helia Admin Console when ready.
 */

"use client";

import { ChatLayout } from "@/components/chat";
import { useHeliaChat } from "@/hooks/useHeliaChat";

export default function HeliaChatPageClient() {
  const {
    conversations,
    activeConversationId,
    messages,
    loading,
    error,
    sendMessage,
    selectConversation,
    startNewChat,
    retry,
  } = useHeliaChat({ product: "helia-suite" });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <p className="text-sm leading-relaxed text-white/50">
        Talk with Helia AI from your workspace. Messages use your logged-in
        Helia session and Helia Brain.
      </p>

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
        onSelectConversation={(id) => void selectConversation(id)}
        onNewChat={startNewChat}
        onSend={(payload) => void sendMessage(payload)}
      />
    </div>
  );
}
