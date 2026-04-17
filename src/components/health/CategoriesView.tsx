"use client";

import { healthCategories } from "@/data/health-workouts";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getWorkoutsByCategoryId } from "@/data/health-workouts";

export function HealthCategoriesView() {
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
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          Programs
        </p>
        <h1 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          Categories
        </h1>
        <p className="mt-2 max-w-[20rem] text-[13px] leading-relaxed text-zinc-500">
          Strength, Cardio, Yoga, and Fat Loss — static catalog for the Helia Health demo.
        </p>
      </motion.header>

      <div className="space-y-3">
        {healthCategories.map((category, index) => {
          const count = getWorkoutsByCategoryId(category.id).length;
          const href = withMarketBasePath(basePath, `/categories/${category.id}`);
          return (
            <motion.div
              key={category.id}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 360, damping: 32, delay: index * 0.06 }
              }
              whileHover={
                reduce ? undefined : { y: -3, transition: { type: "spring", stiffness: 480, damping: 28 } }
              }
              whileTap={reduce ? undefined : { scale: 0.99 }}
            >
              <Link
                href={href}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04] transition-[box-shadow] duration-500 hover:[box-shadow:var(--shadow-card-hover)]"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-black/5">
                  <Image src={category.image} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-900">
                    {category.name}
                  </p>
                  <p className="truncate text-[12px] text-zinc-500">{category.tagline}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-emerald-600">
                    <Layers className="h-3.5 w-3.5" aria-hidden />
                    <span className="text-[13px] font-semibold tabular-nums text-zinc-800">{count}</span>
                    <span className="text-[11px] font-medium text-zinc-400">workouts</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

