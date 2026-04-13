"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { WHATSAPP_URL } from "@/config/site";
import type { Dictionary } from "@/lib/dictionaries/types";
import type { Locale } from "@/config/i18n";
import { Button } from "@/components/ui/Button";
import { staggerChild, staggerParent } from "@/lib/motion";

export function CTASection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const supportHref = `/${locale}/support`;
  const demoHref = `/${locale}#lead-demo`;

  return (
    <section className="container-main pb-12 pt-4 md:pb-16 md:pt-8">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#161618] via-[#141416] to-background px-6 py-16 text-center shadow-[0_28px_100px_-40px_rgba(0,0,0,0.85)] md:px-12 md:py-20"
      >
        <div className="mx-auto max-w-3xl">
          <motion.h2
            variants={staggerChild}
            className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl"
          >
            {dict.home.ctaTitle}
          </motion.h2>
          <motion.p
            variants={staggerChild}
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/60"
          >
            {dict.home.ctaSubtitle}
          </motion.p>
          <motion.div
            variants={staggerChild}
            className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:justify-center"
          >
            <Button
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-14 w-full px-10 text-base sm:w-auto"
            >
              {dict.home.ctaWhatsApp}
            </Button>
            <Button
              href={supportHref}
              variant="secondary"
              className="min-h-14 w-full px-10 text-base sm:w-auto"
            >
              {dict.nav.contact}
            </Button>
          </motion.div>
          <motion.p variants={staggerChild} className="mt-8">
            <Link
              href={demoHref}
              className="text-sm font-medium text-accent underline-offset-4 transition-opacity duration-300 hover:underline hover:opacity-90"
            >
              {dict.form.title}
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
