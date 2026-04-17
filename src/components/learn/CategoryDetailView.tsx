"use client";

import { CourseCard } from "@/components/learn/CourseCard";
import {
  getCoursesByCategoryId,
  getLearnCategoryById,
} from "@/data/learn-courses";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { ChevronLeft, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";

export function CategoryDetailView({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const reduce = useReducedMotionHydrationSafe();
  const basePath = useMarketBasePath();
  const category = getLearnCategoryById(categoryId);
  const catalog = getCoursesByCategoryId(categoryId);

  if (!category) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-zinc-600">Category not found.</p>
        <Link
          href={withMarketBasePath(basePath, "/categories")}
          className="text-sm font-semibold text-orange-600"
        >
          Back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="relative px-6 pb-5 pt-3">
        <motion.button
          type="button"
          aria-label="Back"
          whileTap={{ scale: 0.94 }}
          onClick={() => router.back()}
          className="absolute left-4 top-[2.75rem] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-[0_10px_28px_-14px_rgba(0,0,0,0.35)] ring-1 ring-zinc-900/10 backdrop-blur-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }
          }
          className="flex flex-col items-center pt-[3.25rem] text-center"
        >
          <div className="relative h-[72px] w-[72px] overflow-hidden rounded-[1.35rem] bg-zinc-100 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
            <Image src={category.image} alt="" fill sizes="72px" className="object-cover" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">{category.name}</h1>
          <p className="mt-1 max-w-[18rem] text-[13px] leading-relaxed text-zinc-500">{category.description}</p>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-violet-600">
            <Layers className="h-4 w-4" aria-hidden />
            <span className="text-sm font-semibold tabular-nums text-zinc-900">{catalog.length}</span>
            <span className="text-[12px] font-medium text-zinc-400">courses</span>
          </div>
        </motion.div>
      </div>

      <div className="px-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[0.9375rem] font-semibold tracking-tight text-zinc-900">Courses</h2>
            <p className="text-[12px] text-zinc-500">{catalog.length} in this category</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {catalog.map((course, index) => (
            <CourseCard key={course.id} course={course} motionIndex={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
