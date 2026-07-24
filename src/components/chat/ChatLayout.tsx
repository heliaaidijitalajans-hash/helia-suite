"use client";

import { cn } from "@/lib/cn";
import { ChatSidebar } from "./ChatSidebar";
import { Conversation } from "./Conversation";
import { MessageInput } from "./MessageInput";
import type {
  ChatConversationSummary,
  ChatMessage,
  ChatSendPayload,
} from "./types";

export function ChatLayout({
  conversations,
  activeConversationId = null,
  messages,
  loading = false,
  onSelectConversation,
  onNewChat,
  onSend,
  className,
}: {
  conversations: ChatConversationSummary[];
  activeConversationId?: string | null;
  messages: ChatMessage[];
  loading?: boolean;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  onSend?: (payload: ChatSendPayload) => void | Promise<void>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[28rem] flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#121214]/90 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm md:min-h-[32rem] md:flex-row",
        className
      )}
    >
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={onSelectConversation}
        onNewChat={onNewChat}
        className="max-h-44 md:max-h-none"
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Conversation messages={messages} loading={loading} />
        <MessageInput
          conversationId={activeConversationId}
          loading={loading}
          onSend={onSend}
        />
      </div>
    </div>
  );
}
