"use client";

import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Crown, Sparkles } from "lucide-react";

export function AIProfileView() {
  const reduce = useReducedMotionHydrationSafe();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-6 pb-10 pt-[3.35rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_50%_-15%,rgba(139,92,246,0.16),transparent),radial-gradient(ellipse_65%_45%_at_100%_80%,rgba(59,130,246,0.10),transparent)]"
      />
      <div className="relative z-10">
        <motion.header
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }}
          className="mb-6"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-violet-600/90">Profile</p>
          <h1 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
            Account
          </h1>
        </motion.header>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 }}
          className="rounded-2xl border border-white/50 bg-white/55 p-5 shadow-[0_18px_44px_-28px_rgba(79,70,229,0.35)] ring-1 ring-violet-200/40 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-blue-600 text-lg font-bold text-white shadow-lg shadow-violet-500/30 ring-2 ring-white/40">
              DU
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold tracking-tight text-zinc-950">Demo User</p>
              <p className="mt-0.5 text-[13px] font-medium text-violet-700">Plan: Pro AI</p>
              <span className="mt-2 inline-flex rounded-full border border-emerald-300/60 bg-emerald-50/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
                Active
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30, delay: 0.06 }}
          className="group mt-5 rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-600/[0.09] via-white/50 to-blue-600/[0.08] p-5 shadow-[0_20px_50px_-30px_rgba(79,70,229,0.4)] ring-1 ring-violet-300/35 backdrop-blur-xl transition duration-300 hover:shadow-[0_24px_56px_-28px_rgba(79,70,229,0.5)]"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-violet-600 shadow-sm ring-1 ring-violet-200/60">
              <Crown className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight text-zinc-950">Upgrade your AI capabilities</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
                Unlock higher limits, priority models, and team workspaces — static CTA for this demo.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-[12px] font-semibold text-white shadow-md shadow-violet-500/25 ring-1 ring-white/20 transition hover:brightness-110 active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                View plans
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
