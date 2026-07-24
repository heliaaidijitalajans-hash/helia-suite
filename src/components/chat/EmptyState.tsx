"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title = "Start a conversation with Helia",
  description = "Ask about your workspace, customers, or automation. Messages will appear here.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
      role="status"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
        <MessageSquare className="h-6 w-6" strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="text-base font-semibold tracking-tight text-white md:text-lg">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">
        {description}
      </p>
    </div>
  );
}
