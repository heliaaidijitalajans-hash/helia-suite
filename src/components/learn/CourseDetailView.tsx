"use client";

import { getCourseById, learnCategories } from "@/data/learn-courses";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { ChevronLeft, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < full ? "fill-current" : "fill-transparent"}`}
          strokeWidth={2}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function CourseDetailView({ courseId }: { courseId: string }) {
  const router = useRouter();
  const reduce = useReducedMotionHydrationSafe();
  const basePath = useMarketBasePath();
  const course = getCourseById(courseId);
  const category = course
    ? learnCategories.find((c) => c.id === course.categoryId)
    : undefined;

  if (!course) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-zinc-600">Course not found.</p>
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
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 28 }
            }
            className="relative h-full w-full"
          >
            <Image
              src={course.image}
              alt={course.title}
              fill
              priority
              sizes="400px"
              className="object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10"
            />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32, delay: 0.05 }
        }
        className="space-y-4 px-6 pb-6 pt-5"
      >
        <h1 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          {course.title}
        </h1>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
          {formatPrice(course.price)}
        </p>
        <p className="text-[13px] font-medium text-zinc-600">Instructor · {course.instructor}</p>
        {category ? (
          <Link
            href={withMarketBasePath(basePath, `/categories/${category.id}`)}
            className="inline-flex text-[13px] font-semibold text-orange-600 transition hover:text-orange-700"
          >
            {category.name}
          </Link>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1.5 ring-1 ring-amber-500/10">
            <StarRow rating={course.rating} />
            <span className="text-[12px] font-semibold tabular-nums text-zinc-900">
              {course.rating.toFixed(1)}
            </span>
          </div>
          {course.isRecommended ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200/80 bg-gradient-to-r from-violet-600/10 via-fuchsia-500/10 to-orange-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-900 ring-1 ring-violet-500/15">
              <Sparkles className="h-3 w-3" aria-hidden />
              AI Recommended
            </span>
          ) : null}
        </div>

        <p className="text-[13px] leading-relaxed text-zinc-600">
          A premium, self-paced module with studio-style briefs and rubrics. Helia Learn is a static
          UI demo — no enrollments, video hosting, or certificates.
        </p>

        <motion.button
          type="button"
          whileTap={{ scale: 0.99 }}
          className="flex w-full items-center justify-center rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-[0_18px_44px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/10 transition hover:bg-zinc-800"
        >
          Start learning (demo)
        </motion.button>
      </motion.div>
    </div>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
