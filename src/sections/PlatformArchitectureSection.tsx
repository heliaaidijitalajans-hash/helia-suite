"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { MotionSection } from "@/components/MotionSection";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

function Layer({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "accent" | "muted";
}) {
  const tones = {
    default: "border-white/10 bg-[#161618] text-white/90",
    accent: "border-accent/30 bg-accent/10 text-accent",
    muted: "border-white/10 bg-[#121214] text-white/70",
  };
  return (
    <div
      className={`w-full max-w-md rounded-2xl border px-5 py-4 text-center text-sm font-semibold tracking-tight shadow-[0_16px_48px_-24px_rgba(0,0,0,0.8)] ${tones[tone]}`}
    >
      {label}
    </div>
  );
}

export function PlatformArchitectureSection({ dict }: { dict: Dictionary }) {
  const d = dict.developer;
  const layers = d.architectureLayers;

  return (
    <MotionSection className="border-y border-white/10 bg-[#0c0c0e]/40 py-20 md:py-28">
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
            {d.architectureTitle}
          </motion.h2>
          <motion.p
            variants={staggerChild}
            className="mt-4 text-lg text-white/60"
          >
            {d.architectureSubtitle}
          </motion.p>
        </motion.div>

        <motion.div
          className="mx-auto mt-14 flex max-w-3xl flex-col items-center gap-3"
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={staggerChild} className="w-full flex justify-center">
            <Layer label={layers.website} />
          </motion.div>
          <motion.div variants={staggerChild} aria-hidden>
            <ChevronDown className="h-5 w-5 text-white/30" />
          </motion.div>
          <motion.div variants={staggerChild} className="w-full flex justify-center">
            <Layer label={layers.platform} tone="accent" />
          </motion.div>
          <motion.div variants={staggerChild} aria-hidden>
            <ChevronDown className="h-5 w-5 text-white/30" />
          </motion.div>
          <motion.div
            variants={staggerChild}
            className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {layers.modules.map((mod) => (
              <div
                key={mod}
                className="rounded-xl border border-white/10 bg-[#161618] px-3 py-3 text-center text-xs font-medium text-white/75"
              >
                {mod}
              </div>
            ))}
          </motion.div>
          <motion.div variants={staggerChild} aria-hidden>
            <ChevronDown className="h-5 w-5 text-white/30" />
          </motion.div>
          <motion.div variants={staggerChild} className="w-full flex justify-center">
            <Layer label={layers.data} tone="muted" />
          </motion.div>
        </motion.div>
      </div>
    </MotionSection>
  );
}
