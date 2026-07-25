"use client";

import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatConversationSummary } from "./types";

export function ChatSidebar({
  conversations,
  activeId = null,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  className,
}: {
  conversations: ChatConversationSummary[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
  onRename?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
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
                <li key={item.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect?.(item.id)}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 pr-16 text-left transition-colors",
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
                  {onRename || onDelete ? (
                    <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                      {onRename ? (
                        <button
                          type="button"
                          title="Rename"
                          aria-label={`Rename ${item.title}`}
                          className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = window.prompt(
                              "Rename conversation",
                              item.title
                            );
                            if (next && next.trim() && next.trim() !== item.title) {
                              onRename(item.id, next.trim());
                            }
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          title="Delete"
                          aria-label={`Delete ${item.title}`}
                          className="rounded-md p-1.5 text-white/40 hover:bg-red-500/15 hover:text-red-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Delete conversation “${item.title}”?`
                              )
                            ) {
                              onDelete(item.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
