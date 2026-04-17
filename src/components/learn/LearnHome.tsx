"use client";

import { CourseCard } from "@/components/learn/CourseCard";
import { courses, type Course } from "@/data/learn-courses";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const sectionEase = [0.16, 1, 0.3, 1] as const;

const sectionReveal = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: sectionEase },
  },
} as const;

function CourseRailSection({
  title,
  subtitle,
  items,
  motionBase,
  delay,
  reduce,
}: {
  title: string;
  subtitle: string;
  items: Course[];
  motionBase: number;
  delay: number;
  reduce: boolean | null | undefined;
}) {
  if (!items.length) return null;
  return (
    <motion.section
      variants={sectionReveal}
      initial="hidden"
      animate="show"
      transition={{ delay: reduce ? 0 : delay }}
      className="shrink-0 space-y-4 px-6 pb-10"
    >
      <div className="space-y-1">
        <h2 className="line-clamp-2 text-[0.9375rem] font-semibold tracking-tight text-zinc-900">
          {title}
        </h2>
        <p className="text-[12px] leading-relaxed text-zinc-500">{subtitle}</p>
      </div>
      <div className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-2 pt-1 scrollbar-hide">
        {items.map((course, index) => (
          <CourseCard
            key={course.id}
            course={course}
            motionIndex={motionBase + index}
            variant="rail"
          />
        ))}
      </div>
    </motion.section>
  );
}

function RecommendedCoursesSection({
  items,
  motionBase,
  delay,
  reduce,
}: {
  items: Course[];
  motionBase: number;
  delay: number;
  reduce: boolean | null | undefined;
}) {
  if (!items.length) return null;
  return (
    <motion.section
      variants={sectionReveal}
      initial="hidden"
      animate="show"
      transition={{ delay: reduce ? 0 : delay }}
      className="shrink-0 px-5 pb-12 sm:px-6"
    >
      <div className="relative overflow-hidden rounded-[1.4rem] border border-zinc-200/90 bg-gradient-to-br from-white via-zinc-50/80 to-violet-50/50 p-[1px] shadow-[0_24px_60px_-32px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-violet-400/[0.14] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-0 h-36 w-36 rounded-full bg-fuchsia-400/[0.1] blur-3xl"
        />
        <div className="relative rounded-[1.32rem] bg-white/85 px-4 pb-6 pt-5 backdrop-blur-[2px] sm:px-6 sm:pb-7 sm:pt-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-zinc-900 to-zinc-800 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm ring-1 ring-white/15">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-200" strokeWidth={2} aria-hidden />
                Helia Sense
              </span>
              <span className="rounded-full border border-violet-200/90 bg-violet-50/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-800 shadow-[0_6px_20px_-10px_rgba(124,58,237,0.35)]">
                For you
              </span>
            </div>
            <div className="space-y-2.5">
              <h2 className="text-balance text-[1.125rem] font-semibold leading-snug tracking-[-0.02em] text-zinc-950 sm:text-[1.25rem]">
                Recommended for you
              </h2>
              <p className="max-w-[22rem] text-[13px] leading-[1.55] text-zinc-500 sm:text-sm sm:leading-relaxed">
                Curated from your learning goals — static demo catalog.
              </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Powered by Helia AI engine
            </p>
            </div>
            <div className="-mx-1 -mb-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2 pt-1 scrollbar-hide sm:gap-6">
              {items.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  motionIndex={motionBase + index}
                  variant="rail"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export function LearnHome() {
  const reduce = useReducedMotionHydrationSafe();
  const basePath = useMarketBasePath();

  const popularCourses = useMemo(() => courses.filter((c) => c.isPopular), []);
  const recommendedCourses = useMemo(
    () => courses.filter((c) => c.isRecommended).slice(0, 8),
    [],
  );

  const railBeforeAll = popularCourses.length + recommendedCourses.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }
        }
        className="shrink-0 px-6 pb-2 pt-[3.35rem]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              Learning platform
            </p>
            <h1 className="mt-2 text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
              Helia Learn
            </h1>
          </div>
          <Link
            href={withMarketBasePath(basePath, "/categories")}
            className="mt-7 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-zinc-800 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.25)] ring-1 ring-zinc-900/10 transition hover:bg-white active:scale-[0.98]"
          >
            Categories
          </Link>
        </div>
      </motion.header>

      <motion.div
        variants={sectionReveal}
        initial="hidden"
        animate="show"
        className="shrink-0 px-6 pb-6 pt-4"
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 260, damping: 30, delay: 0.06 }
          }
          className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-px shadow-[0_24px_56px_-28px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
        >
          <div className="relative overflow-hidden rounded-[15px] px-5 py-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/[0.07] blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-violet-400/[0.09] blur-3xl"
            />
            <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Helia Sense
            </p>
            <p className="relative mt-3 max-w-[17rem] text-lg font-semibold leading-snug tracking-tight text-white">
              AI-powered learning experience
            </p>
            <p className="relative mt-3 max-w-[18rem] text-[13px] leading-relaxed text-zinc-400">
              Popular courses, recommendations, and category tracks — static catalog, no backend.
            </p>
            <p className="relative mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Powered by Helia AI engine
            </p>
          </div>
        </motion.div>
      </motion.div>

      <CourseRailSection
        title="Popular Courses"
        subtitle="What learners are enrolling in this week (demo)"
        items={popularCourses}
        motionBase={0}
        delay={0.08}
        reduce={reduce}
      />

      <RecommendedCoursesSection
        items={recommendedCourses}
        motionBase={popularCourses.length}
        delay={0.12}
        reduce={reduce}
      />

      <motion.section
        variants={sectionReveal}
        initial="hidden"
        animate="show"
        transition={{ delay: reduce ? 0 : 0.16 }}
        className="min-h-0 flex-1 space-y-4 px-6 pb-10"
      >
        <div className="space-y-1">
          <h2 className="text-[0.9375rem] font-semibold tracking-tight text-zinc-900">All courses</h2>
          <p className="text-[12px] text-zinc-500">Browse the full demo catalog</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {courses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              motionIndex={index + railBeforeAll}
            />
          ))}
        </div>
      </motion.section>
    </div>
  );
}
