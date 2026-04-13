"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Smartphone,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { MotionSection } from "@/components/MotionSection";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

const keys = ["mobile", "dashboard", "automation", "growth"] as const;
const icons: Record<(typeof keys)[number], LucideIcon> = {
  mobile: Smartphone,
  dashboard: LayoutDashboard,
  automation: Zap,
  growth: TrendingUp,
};

export function ServicesBento({ dict }: { dict: Dictionary }) {
  return (
    <MotionSection className="container-main py-20 md:py-28">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.h2
          variants={staggerChild}
          className="text-3xl font-semibold tracking-tight md:text-4xl"
        >
          {dict.home.servicesTitle}
        </motion.h2>
        <motion.p
          variants={staggerChild}
          className="mt-4 text-lg text-white/60"
        >
          {dict.home.servicesSubtitle}
        </motion.p>
      </motion.div>
      <motion.div
        className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {keys.map((key, i) => {
          const item = dict.home.services[key];
          const Icon = icons[key];
          const large = i === 0 || i === 3;
          return (
            <motion.div
              key={key}
              variants={staggerChild}
              className={`group relative rounded-2xl border border-white/10 bg-[#161618] p-8 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.75)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:z-10 hover:scale-[1.02] hover:border-accent/35 hover:shadow-[0_28px_80px_-24px_rgba(212,175,55,0.12)] ${
                large ? "lg:col-span-2 lg:min-h-[220px]" : ""
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:border-accent/25 group-hover:text-[#e8c547]">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {item.body}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </MotionSection>
  );
}
