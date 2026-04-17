"use client";

import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { ChevronRight, Clock } from "lucide-react";

const ITEMS = [
  { title: "Instagram ad copy", hint: "Static demo · 2m ago" },
  { title: "Startup idea", hint: "Static demo · Yesterday" },
  { title: "Landing page text", hint: "Static demo · Last week" },
] as const;

export function AIHistoryView() {
  const reduce = useReducedMotionHydrationSafe();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-6 pb-10 pt-[3.35rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(139,92,246,0.14),transparent),radial-gradient(ellipse_70%_50%_at_100%_30%,rgba(59,130,246,0.10),transparent)]"
      />
      <div className="relative z-10">
        <motion.header
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }}
          className="mb-6"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-violet-600/90">History</p>
          <h1 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
            Recent activity
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
            Your last prompts — demo only, not stored.
          </p>
        </motion.header>

        <ul className="space-y-3">
          {ITEMS.map(({ title, hint }, i) => (
            <motion.li
              key={title}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduce ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 30, delay: 0.05 * i }
              }
            >
              <button
                type="button"
                className="group flex w-full items-center gap-3 rounded-2xl border border-white/50 bg-white/55 p-4 text-left shadow-[0_16px_40px_-28px_rgba(79,70,229,0.35)] ring-1 ring-violet-200/40 backdrop-blur-xl transition duration-300 hover:border-violet-300/60 hover:bg-white/70 hover:shadow-[0_20px_48px_-26px_rgba(79,70,229,0.45)] active:scale-[0.99]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/15 text-violet-700 ring-1 ring-violet-300/30">
                  <Clock className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold tracking-tight text-zinc-900">{title}</span>
                  <span className="mt-0.5 block text-[12px] text-zinc-500">{hint}</span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
