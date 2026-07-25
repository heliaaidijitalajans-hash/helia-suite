"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Code2,
  Compass,
  KeyRound,
  Radio,
  Shield,
  Terminal,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { MotionSection } from "@/components/MotionSection";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

const icons: LucideIcon[] = [
  Code2,
  KeyRound,
  Shield,
  Terminal,
  Compass,
  Webhook,
  Radio,
  BookOpen,
];

export function DeveloperPlatformSection({ dict }: { dict: Dictionary }) {
  const d = dict.developer;

  return (
    <MotionSection
      id="developer-platform"
      className="container-main scroll-mt-24 py-20 md:scroll-mt-28 md:py-28"
      aria-labelledby="developer-platform-heading"
    >
      <motion.div
        className="mx-auto max-w-2xl text-center"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.p
          variants={staggerChild}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/90"
        >
          API Platform
        </motion.p>
        <motion.h2
          id="developer-platform-heading"
          variants={staggerChild}
          className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl"
        >
          {d.platformTitle}
        </motion.h2>
        <motion.p
          variants={staggerChild}
          className="mt-4 text-lg text-white/60"
        >
          {d.platformSubtitle}
        </motion.p>
      </motion.div>

      <motion.div
        className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {d.features.map((item, i) => {
          const Icon = icons[i] ?? Code2;
          return (
            <motion.div
              key={item.title}
              variants={staggerChild}
              className="group relative rounded-2xl border border-white/10 bg-[#161618] p-6 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.75)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:z-10 hover:scale-[1.02] hover:border-accent/35 hover:shadow-[0_28px_80px_-24px_rgba(212,175,55,0.12)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:border-accent/25 group-hover:text-[#e8c547]">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-accent/80">
                {item.meta}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {item.body}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </MotionSection>
  );
}
