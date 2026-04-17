"use client";

import type { Course } from "@/data/learn-courses";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const springIn = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.7 };
const springHover = { type: "spring" as const, stiffness: 520, damping: 34, mass: 0.45 };

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < full ? "fill-current" : "fill-transparent"}`}
          strokeWidth={2}
          aria-hidden
        />
      ))}
    </div>
  );
}

type CourseCardProps = {
  course: Course;
  motionIndex?: number;
  variant?: "grid" | "rail";
};

export function CourseCard({ course, motionIndex = 0, variant = "grid" }: CourseCardProps) {
  const isRail = variant === "rail";
  const reduce = useReducedMotionHydrationSafe();
  const basePath = useMarketBasePath();
  const href = withMarketBasePath(basePath, `/course/${course.id}`);

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={
        reduce ? { duration: 0 } : { ...springIn, delay: motionIndex * 0.065 }
      }
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
        <div
          className={`relative w-full overflow-hidden bg-zinc-100 ${isRail ? "aspect-[4/5]" : "aspect-square"}`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/[0.06] via-transparent to-white/[0.12] opacity-80"
          />
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes={isRail ? "156px" : "(max-width: 400px) 50vw, 186px"}
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.05]"
            priority={motionIndex < 2}
          />
          {course.isRecommended ? (
            <span className="absolute right-2.5 top-2.5 z-20 inline-flex items-center rounded-full border border-violet-200/70 bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-900 shadow-[0_10px_26px_-14px_rgba(124,58,237,0.5)] ring-1 ring-violet-500/10 backdrop-blur-md">
              AI Recommended
            </span>
          ) : null}
          <div className="absolute bottom-2 left-2.5 right-2.5 z-20 flex items-center justify-between gap-2 rounded-xl bg-black/45 px-2 py-1.5 ring-1 ring-white/10 backdrop-blur-md">
            <StarRow rating={course.rating} />
            <span className="text-[11px] font-semibold tabular-nums text-white">
              {course.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>
      <Link
        href={href}
        scroll
        className={`relative block border-t border-zinc-900/[0.04] bg-white/95 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20 ${isRail ? "space-y-1 px-3 py-3" : "space-y-1.5 px-3.5 py-3.5"}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {course.instructor}
        </p>
        <h3
          className={`line-clamp-2 font-semibold tracking-tight text-zinc-900 ${isRail ? "text-[12px] leading-snug" : "text-[13px] leading-snug"}`}
        >
          {course.title}
        </h3>
        <p
          className={`font-semibold tabular-nums tracking-tight text-zinc-700 ${isRail ? "text-[13px]" : "text-sm"}`}
        >
          {formatPrice(course.price)}
        </p>
      </Link>
    </motion.article>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
