"use client";

import { motion } from "framer-motion";
import {
  Cookie,
  Database,
  FileKey2,
  KeyRound,
  Lock,
  ScrollText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { MotionSection } from "@/components/MotionSection";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

const icons: LucideIcon[] = [
  ShieldCheck,
  KeyRound,
  Cookie,
  Users,
  ScrollText,
  FileKey2,
  Lock,
  Database,
];

export function DeveloperSecuritySection({ dict }: { dict: Dictionary }) {
  const d = dict.developer;

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
          {d.securityTitle}
        </motion.h2>
        <motion.p
          variants={staggerChild}
          className="mt-4 text-lg text-white/60"
        >
          {d.securitySubtitle}
        </motion.p>
      </motion.div>

      <motion.div
        className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {d.securityCards.map((card, i) => {
          const Icon = icons[i] ?? ShieldCheck;
          return (
            <motion.div
              key={card.title}
              variants={staggerChild}
              className="group rounded-2xl border border-white/10 bg-[#161618] p-6 transition-[transform,border-color,box-shadow] duration-300 hover:scale-[1.02] hover:border-accent/35 hover:shadow-[0_24px_70px_-28px_rgba(212,175,55,0.1)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent transition-colors group-hover:border-accent/25">
                <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {card.body}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </MotionSection>
  );
}
