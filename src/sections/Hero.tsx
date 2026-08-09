"use client";

import { motion } from "framer-motion";
import { WHATSAPP_URL } from "@/config/site";
import type { Dictionary } from "@/lib/dictionaries/types";
import type { Locale } from "@/config/i18n";
import { Button } from "@/components/ui/Button";
import { staggerChild, staggerParent } from "@/lib/motion";

export function Hero({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const prefix = `/${locale}`;

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-36">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(90vw,720px)] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-[100px]"
        aria-hidden
      />
      <motion.div
        className="container-main relative mx-auto max-w-4xl text-center"
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          variants={staggerChild}
          className="relative inline-flex items-center justify-center"
        >
          <span
            className="absolute inset-0 scale-150 rounded-full bg-gradient-to-r from-amber-400/25 via-accent/35 to-amber-500/20 blur-2xl"
            aria-hidden
          />
          <span className="relative bg-gradient-to-r from-[#f0dc82] via-[#d4af37] to-[#b8962e] bg-clip-text text-xs font-semibold uppercase tracking-[0.22em] text-transparent">
            Helia Suite
          </span>
        </motion.p>
        <motion.h1
          variants={staggerChild}
          className="mt-7 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl lg:leading-[1.06]"
        >
          {dict.home.heroTitle}
        </motion.h1>
        <motion.p
          variants={staggerChild}
          className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/65 md:text-xl md:leading-relaxed"
        >
          {dict.home.heroSubtitle}
        </motion.p>
        <motion.div
          variants={staggerChild}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <Button
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-14 w-full px-8 text-base sm:w-auto"
          >
            {dict.home.heroCta}
          </Button>
          <Button
            href={`${prefix}/support`}
            variant="secondary"
            className="min-h-14 w-full px-8 text-base sm:w-auto"
          >
            {dict.nav.contact}
          </Button>
        </motion.div>
        <motion.p
          variants={staggerChild}
          className="mt-10 text-sm font-medium tracking-wide text-white/45"
        >
          {dict.home.heroTrustLine}
        </motion.p>
      </motion.div>
    </section>
  );
}
