"use client";

import { motion } from "framer-motion";
import { ClipboardList, Layers, Rocket } from "lucide-react";
import { MotionSection } from "@/components/MotionSection";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

const stepIcons = [ClipboardList, Layers, Rocket] as const;

export function HowItWorks({ dict }: { dict: Dictionary }) {
  return (
    <MotionSection className="border-y border-white/10 bg-surface/25 py-20 md:py-28">
      <div className="container-main">
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
            {dict.home.howTitle}
          </motion.h2>
          <motion.p
            variants={staggerChild}
            className="mt-4 text-lg text-white/60"
          >
            {dict.home.howSubtitle}
          </motion.p>
        </motion.div>

        <div className="relative mt-16 md:mt-20">
          <div
            className="pointer-events-none absolute left-[8%] right-[8%] top-[2.25rem] hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block"
            aria-hidden
          />
          <motion.ol
            className="relative grid gap-10 md:grid-cols-3 md:gap-8"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {dict.home.steps.map((step, index) => {
              const Icon = stepIcons[index] ?? ClipboardList;
              return (
                <motion.li
                  key={step.title}
                  className="relative flex flex-col items-center text-center md:items-center"
                  variants={staggerChild}
                >
                  <div className="relative z-[1] flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#161618] text-accent shadow-[0_16px_48px_-20px_rgba(0,0,0,0.7)] transition-[border-color,box-shadow] duration-300 hover:border-accent/30">
                    <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                  </div>
                  <span className="mt-5 text-xs font-semibold uppercase tracking-wider text-accent/90">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
                    {step.body}
                  </p>
                  {index < dict.home.steps.length - 1 ? (
                    <div
                      className="my-4 h-10 w-px bg-gradient-to-b from-white/20 to-transparent md:hidden"
                      aria-hidden
                    />
                  ) : null}
                </motion.li>
              );
            })}
          </motion.ol>
        </div>
      </div>
    </MotionSection>
  );
}
