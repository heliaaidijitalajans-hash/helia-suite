"use client";

import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatConversationSummary } from "./types";

export function ChatSidebar({
  conversations,
  activeId = null,
  onSelect,
  onNewChat,
  className,
}: {
  conversations: ChatConversationSummary[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full flex-col border-b border-white/[0.08] bg-[#0d0d0f]/60 md:w-64 md:shrink-0 md:border-b-0 md:border-r",
        className
      )}
      aria-label="Conversation history"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
          History
        </p>
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-accent/30 hover:bg-white/[0.06] hover:text-white"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" strokeWidth={1.75} />
          New
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-white/35">
            No conversations yet. Start chatting to build history.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((item) => {
              const active = item.id === activeId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(item.id)}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                      active
                        ? "bg-white/[0.07] text-white ring-1 ring-accent/20"
                        : "text-white/55 hover:bg-white/[0.04] hover:text-white/85"
                    )}
                  >
                    <span className="block truncate text-sm font-medium">
                      {item.title}
                    </span>
                    {item.preview ? (
                      <span className="mt-0.5 block truncate text-[11px] text-white/35">
                        {item.preview}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
