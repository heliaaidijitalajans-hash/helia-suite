"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatSendPayload } from "./types";

export function MessageInput({
  conversationId = null,
  disabled = false,
  loading = false,
  placeholder = "Message Helia…",
  onSend,
  className,
}: {
  conversationId?: string | null;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  /** Hook point for Helia Cloud Brain — UI stays unchanged when wired. */
  onSend?: (payload: ChatSendPayload) => void | Promise<void>;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const busy = disabled || loading;
  const canSend = value.trim().length > 0 && !busy;

  async function submit() {
    const content = value.trim();
    if (!content || busy) return;
    const payload: ChatSendPayload = { conversationId, content };
    setValue("");
    await onSend?.(payload);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "border-t border-white/[0.08] bg-[#0d0d0f]/80 p-3 backdrop-blur-md md:p-4",
        className
      )}
    >
      <div className="flex items-end gap-2 rounded-2xl border border-white/[0.1] bg-[#121214] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:border-accent/35">
        <label className="sr-only" htmlFor="helia-chat-input">
          Message
        </label>
        <textarea
          id="helia-chat-input"
          rows={1}
          value={value}
          disabled={busy}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-white placeholder:text-white/35 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
            canSend
              ? "bg-accent text-[#0A0A0B] hover:brightness-110"
              : "bg-white/[0.06] text-white/30"
          )}
        >
          <Send className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
      <p className="mt-2 px-1 text-[11px] text-white/30">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}
