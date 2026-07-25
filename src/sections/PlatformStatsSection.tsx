"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MotionSection } from "@/components/MotionSection";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

function StatValue({ value, active }: { value: string; active: boolean }) {
  const reduce = useReducedMotion();
  const numeric = /^(\d+)/.exec(value);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!active || !numeric || reduce) {
      setN(numeric ? Number(numeric[1]) : 0);
      return;
    }
    const target = Number(numeric[1]);
    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, numeric, reduce, value]);

  if (!numeric) return <>{value}</>;
  return (
    <>
      {n}
      {value.slice(numeric[1].length)}
    </>
  );
}

export function PlatformStatsSection({ dict }: { dict: Dictionary }) {
  const d = dict.developer;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

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
          {d.statsTitle}
        </motion.h2>
      </motion.div>

      <motion.div
        ref={ref}
        className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {d.stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerChild}
            className="rounded-2xl border border-white/10 bg-[#161618] px-6 py-8 text-center transition-[border-color,transform] duration-300 hover:scale-[1.02] hover:border-accent/30"
          >
            <p className="text-3xl font-semibold tracking-tight text-accent md:text-4xl">
              <StatValue value={stat.value} active={inView} />
            </p>
            <p className="mt-3 text-sm font-medium text-white/55">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </MotionSection>
  );
}
