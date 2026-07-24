"use client";

import { cn } from "@/lib/cn";
import type { ChatMessage } from "./types";

export function MessageBubble({
  message,
  className,
}: {
  message: ChatMessage;
  className?: string;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {!isUser ? (
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-[10px] font-bold text-accent"
          aria-hidden
        >
          H
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-md bg-accent text-[#0A0A0B] shadow-[0_12px_40px_-20px_rgba(212,175,55,0.45)]"
            : "rounded-tl-md border border-white/[0.08] bg-[#161618]/95 text-white/85 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.8)]"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}
