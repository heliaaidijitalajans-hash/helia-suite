"use client";

import { getWorkoutById } from "@/data/health-workouts";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { ChevronLeft, Flame, Sparkles, Timer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";

export function WorkoutDetailView({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const reduce = useReducedMotionHydrationSafe();
  const basePath = useMarketBasePath();
  const workout = getWorkoutById(workoutId);

  if (!workout) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-zinc-600">Workout not found.</p>
        <Link
          href={withMarketBasePath(basePath, "/shop")}
          className="text-sm font-semibold text-orange-600"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="relative -mx-6">
        <div className="relative aspect-[4/5] w-full bg-zinc-100">
          <motion.button
            type="button"
            aria-label="Back"
            whileTap={{ scale: 0.94 }}
            onClick={() => router.back()}
            className="absolute left-4 top-[3.25rem] z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.35)] ring-1 ring-zinc-900/10 backdrop-blur-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 28 }}
            className="relative h-full w-full"
          >
            <Image src={workout.image} alt={workout.title} fill priority sizes="400px" className="object-cover" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10" />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32, delay: 0.05 }}
        className="space-y-4 px-6 pb-6 pt-5"
      >
        <h1 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          {workout.title}
        </h1>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-700">
            <Timer className="h-4 w-4 text-zinc-500" aria-hidden />
            {workout.durationMin} min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-700">
            <Flame className="h-4 w-4 text-orange-500" aria-hidden />
            {workout.caloriesKcal} kcal
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-700">
            {workout.difficulty}
          </span>
          {workout.isRecommended ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-900 ring-1 ring-emerald-500/10">
              <Sparkles className="h-3 w-3" aria-hidden />
              AI Recommended
            </span>
          ) : null}
        </div>

        <p className="text-[13px] leading-relaxed text-zinc-600">
          Personalized for your goals by Helia AI.
        </p>

        <motion.button
          type="button"
          whileTap={{ scale: 0.99 }}
          className="flex w-full items-center justify-center rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-[0_18px_44px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/10 transition hover:bg-zinc-800"
        >
          Start Workout (demo)
        </motion.button>
      </motion.div>
    </div>
  );
}

