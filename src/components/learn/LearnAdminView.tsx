"use client";

import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { BarChart3, GraduationCap, Users } from "lucide-react";

export function LearnAdminView() {
  const reduce = useReducedMotionHydrationSafe();

  return (
    <div className="px-5 pb-28 pt-[3.25rem]">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }
        }
        className="mb-6"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">Instructor</p>
        <h1 className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          Hub
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
          Simulated cohort analytics — static demo, no backend.
        </p>
      </motion.header>

      <div className="grid gap-4">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32, delay: 0.04 }
          }
          className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-5 text-white ring-1 ring-black/10"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            <GraduationCap className="h-4 w-4 text-violet-200" aria-hidden />
            Cohort pulse
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Active learners</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">2,847</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Completion</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">68%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32, delay: 0.08 }
          }
          className="rounded-2xl bg-white p-5 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            <Users className="h-4 w-4 text-zinc-400" aria-hidden />
            Engagement
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Lesson replays and quiz attempts are trending up week over week (simulated).
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32, delay: 0.12 }
          }
          className="rounded-2xl bg-white p-5 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            <BarChart3 className="h-4 w-4 text-zinc-400" aria-hidden />
            Revenue (demo)
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900">$18,420</p>
          <p className="mt-1 text-[12px] text-zinc-500">Rolling 30-day course sales — illustrative only.</p>
        </motion.div>
      </div>
    </div>
  );
}
