"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

export function SocialProof({ dict }: { dict: Dictionary }) {
  const h = dict.home;

  return (
    <section className="border-y border-white/[0.06] bg-[#0c0c0e]/40 py-20 md:py-28">
      <motion.div
        className="container-main mx-auto max-w-2xl px-4 text-center md:px-6"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        <motion.h2
          variants={staggerChild}
          className="text-3xl font-semibold tracking-tight text-white md:text-4xl"
        >
          {h.socialProofTitle}
        </motion.h2>
        <motion.p
          variants={staggerChild}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55 md:text-lg md:leading-relaxed"
        >
          {h.socialProofSubtitle}
        </motion.p>
        <motion.p
          variants={staggerChild}
          className="mx-auto mt-8 max-w-md text-sm font-medium text-white/40 md:mt-10"
        >
          {h.socialProofTagline}
        </motion.p>
      </motion.div>
    </section>
  );
}
