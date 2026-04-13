"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

export function SocialProof({ dict }: { dict: Dictionary }) {
  const brands = dict.home.socialProofBrands;

  return (
    <section className="border-y border-white/10 bg-[#0c0c0e]/80 py-14 md:py-16">
      <motion.div
        className="container-main flex flex-wrap items-center justify-center gap-x-4 gap-y-4 md:gap-x-6 md:gap-y-6"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        <motion.p
          variants={staggerChild}
          className="w-full basis-full text-center text-xs font-medium uppercase tracking-[0.2em] text-white/45"
        >
          {dict.home.socialProofTitle}
        </motion.p>
        {brands.map((name) => (
          <motion.div key={name} variants={staggerChild}>
            <div
              className="flex min-h-[52px] min-w-[120px] items-center justify-center rounded-xl border border-white/10 bg-[#161618] px-8 py-4 text-sm font-semibold tracking-[0.18em] text-white/35 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.65)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:border-white/[0.14] hover:text-white/50 md:min-w-[140px]"
              aria-hidden
            >
              {name}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
