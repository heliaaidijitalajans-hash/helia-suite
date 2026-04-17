"use client";

import { CategoryCard } from "@/components/learn/CategoryCard";
import { learnCategories } from "@/data/learn-courses";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";

export function CategoriesView() {
  const reduce = useReducedMotionHydrationSafe();

  return (
    <div className="px-6 pb-8 pt-[3.35rem]">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }
        }
        className="mb-6"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">Browse</p>
        <h1 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          Categories
        </h1>
        <p className="mt-2 max-w-[20rem] text-[13px] leading-relaxed text-zinc-500">
          Design, AI, and Business tracks — static catalog for the Helia Learn demo.
        </p>
      </motion.header>

      <div className="space-y-3">
        {learnCategories.map((category, index) => (
          <CategoryCard key={category.id} category={category} index={index} />
        ))}
      </div>
    </div>
  );
}
