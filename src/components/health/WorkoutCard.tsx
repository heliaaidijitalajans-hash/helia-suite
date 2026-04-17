"use client";

import type { Workout } from "@/data/health-workouts";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Flame, Timer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const springIn = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.7 };
const springHover = { type: "spring" as const, stiffness: 520, damping: 34, mass: 0.45 };

type WorkoutCardProps = {
  workout: Workout;
  motionIndex?: number;
  variant?: "grid" | "rail";
};

export function WorkoutCard({ workout, motionIndex = 0, variant = "grid" }: WorkoutCardProps) {
  const isRail = variant === "rail";
  const reduce = useReducedMotionHydrationSafe();
  const basePath = useMarketBasePath();
  const href = withMarketBasePath(basePath, `/workout/${workout.id}`);

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={reduce ? { duration: 0 } : { ...springIn, delay: motionIndex * 0.065 }}
      whileHover={
        reduce
          ? undefined
          : {
              y: -4,
              scale: 1.012,
              transition: springHover,
            }
      }
      whileTap={reduce ? undefined : { scale: 0.985, transition: { duration: 0.15 } }}
      className={`group relative overflow-hidden rounded-2xl bg-white [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.035] transition-[box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:[box-shadow:var(--shadow-card-hover)] ${isRail ? "w-[156px] shrink-0 snap-start" : "w-full"}`}
    >
      <Link
        href={href}
        scroll
        className="relative block outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className={`relative w-full overflow-hidden bg-zinc-100 ${isRail ? "aspect-[4/5]" : "aspect-square"}`}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/[0.06] via-transparent to-white/[0.12] opacity-80"
          />
          <Image
            src={workout.image}
            alt={workout.title}
            fill
            sizes={isRail ? "156px" : "(max-width: 400px) 50vw, 186px"}
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.05]"
            priority={motionIndex < 2}
          />
          {workout.isRecommended ? (
            <span className="absolute right-2.5 top-2.5 z-20 inline-flex items-center rounded-full border border-emerald-200/60 bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900 shadow-[0_10px_26px_-14px_rgba(16,185,129,0.5)] ring-1 ring-emerald-500/10 backdrop-blur-md">
              AI Recommended
            </span>
          ) : null}
          <div className="absolute bottom-2 left-2.5 right-2.5 z-20 rounded-xl bg-black/45 px-2.5 py-1.5 ring-1 ring-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 text-white">
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1 text-white/90">
                  <Timer className="h-3.5 w-3.5" aria-hidden />
                  {workout.durationMin} min
                </span>
                <span className="text-white/60">·</span>
                <span className="text-white/85">{workout.difficulty}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/90">
                <Flame className="h-3.5 w-3.5" aria-hidden />
                {workout.caloriesKcal} kcal
              </span>
            </div>
          </div>
        </div>
      </Link>
      <Link
        href={href}
        scroll
        className={`relative block border-t border-zinc-900/[0.04] bg-white/95 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20 ${isRail ? "space-y-1 px-3 py-3" : "space-y-1.5 px-3.5 py-3.5"}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {workout.difficulty}
        </p>
        <h3 className={`line-clamp-2 font-semibold tracking-tight text-zinc-900 ${isRail ? "text-[12px] leading-snug" : "text-[13px] leading-snug"}`}>
          {workout.title}
        </h3>
        <p className={`text-[12px] font-semibold tabular-nums text-zinc-600 ${isRail ? "" : ""}`}>
          {workout.durationMin} min · {workout.caloriesKcal} kcal
        </p>
      </Link>
    </motion.article>
  );
}

