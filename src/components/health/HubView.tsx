"use client";

import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Activity, BarChart3, Sparkles } from "lucide-react";

export function HealthHubView() {
  const reduce = useReducedMotionHydrationSafe();

  return (
    <div className="px-5 pb-28 pt-[3.25rem]">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }}
        className="mb-6"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">Coach</p>
        <h1 className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          Hub
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
          Stats and insights — static demo, no backend.
        </p>
      </motion.header>

      <div className="grid gap-4">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32, delay: 0.04 }}
          className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-5 text-white ring-1 ring-black/10"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            <Activity className="h-4 w-4 text-emerald-200" aria-hidden />
            Weekly stats
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Workouts</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">4</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Calories</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">1240</p>
              <p className="text-[10px] text-zinc-400">kcal</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Streak</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">6</p>
              <p className="text-[10px] text-zinc-400">days</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32, delay: 0.08 }}
          className="rounded-2xl bg-white p-5 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            <Sparkles className="h-4 w-4 text-zinc-400" aria-hidden />
            AI Insights
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            You&apos;re improving endurance by <span className="font-semibold text-zinc-900">12%</span>{" "}
            this week.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
            Helia AI adjusts intensity and recovery windows based on your streak (demo).
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32, delay: 0.12 }}
          className="rounded-2xl bg-white p-5 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            <BarChart3 className="h-4 w-4 text-zinc-400" aria-hidden />
            Coaching summary
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Consistency is trending up. Keep sessions under 25 minutes to protect recovery while you
            extend your streak (demo).
          </p>
        </motion.div>
      </div>
    </div>
  );
}

