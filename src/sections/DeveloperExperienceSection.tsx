"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { MotionSection } from "@/components/MotionSection";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

const SAMPLE = `GET /api/projects
Authorization: Bearer ****

200 OK
{
  "ok": true,
  "projects": [
    {
      "id": "prj_8f2a…",
      "name": "Production",
      "environment": "production"
    }
  ]
}`;

export function DeveloperExperienceSection({ dict }: { dict: Dictionary }) {
  const d = dict.developer;

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
            {d.experienceTitle}
          </motion.h2>
          <motion.p
            variants={staggerChild}
            className="mt-4 text-lg text-white/60"
          >
            {d.experienceIntro}
          </motion.p>
        </motion.div>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0f] shadow-[0_28px_80px_-36px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-[11px] font-medium uppercase tracking-wider text-white/35">
                {d.codeLabel}
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-relaxed text-emerald-100/85 md:text-[13px]">
              {SAMPLE}
            </pre>
          </motion.div>

          <motion.ul
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {d.experiencePoints.map((point) => (
              <motion.li
                key={point.title}
                variants={staggerChild}
                className="rounded-2xl border border-white/10 bg-[#161618] p-5 transition-[border-color,transform] duration-300 hover:scale-[1.01] hover:border-accent/30"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">
                      {point.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                      {point.body}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </MotionSection>
  );
}
