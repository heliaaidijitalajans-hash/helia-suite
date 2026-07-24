"use client";

import { cn } from "@/lib/cn";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage } from "./types";

export function Conversation({
  messages,
  loading = false,
  className,
  emptyTitle,
  emptyDescription,
}: {
  messages: ChatMessage[];
  loading?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const isEmpty = messages.length === 0 && !loading;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 md:px-5 md:py-5",
        className
      )}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {isEmpty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {loading ? <TypingIndicator /> : null}
        </div>
      )}
    </div>
  );
}
