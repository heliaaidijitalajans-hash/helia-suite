"use client";

import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import Link from "next/link";

export function HealthSavedView() {
  const reduce = useReducedMotionHydrationSafe();
  const basePath = useMarketBasePath();

  return (
    <div className="px-6 pb-8 pt-[3.35rem]">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }}
        className="mb-6"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">Library</p>
        <h1 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          Saved
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
          Saved workouts and plans — demo only, no sync.
        </p>
      </motion.header>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-6 text-center [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
      >
        <p className="text-sm font-medium text-zinc-600">No saved workouts yet.</p>
        <Link
          href={withMarketBasePath(basePath, "/shop")}
          className="mt-4 inline-flex text-sm font-semibold text-orange-600"
        >
          Explore workouts
        </Link>
      </motion.div>
    </div>
  );
}

