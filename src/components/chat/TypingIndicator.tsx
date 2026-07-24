"use client";

import { cn } from "@/lib/cn";

export function TypingIndicator({
  className,
  label = "Helia is thinking",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("flex items-start gap-3 px-1", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-[10px] font-bold text-accent">
        H
      </div>
      <div className="rounded-2xl rounded-tl-md border border-white/[0.08] bg-[#161618]/95 px-4 py-3 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/45"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
