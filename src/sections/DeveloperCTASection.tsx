"use client";

import { motion } from "framer-motion";
import type { Locale } from "@/config/i18n";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/dictionaries/types";
import { staggerChild, staggerParent } from "@/lib/motion";

export function DeveloperCTASection({
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const d = dict.developer;
  // Auth pages are locale-agnostic; middleware protects /dashboard and /admin.
  const docsHref = `/login?next=${encodeURIComponent("/dashboard/documentation")}`;
  const testerHref = `/login?next=${encodeURIComponent("/admin/api-tester")}`;

  return (
    <section className="container-main pb-8 pt-4 md:pb-12 md:pt-8">
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
            {d.ctaTitle}
          </motion.h2>
          <motion.p
            variants={staggerChild}
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/60"
          >
            {d.ctaSubtitle}
          </motion.p>
          <motion.div
            variants={staggerChild}
            className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center"
          >
            <Button
              href={docsHref}
              className="min-h-14 w-full px-10 text-base sm:w-auto"
            >
              {d.ctaDocs}
            </Button>
            <Button
              href={testerHref}
              variant="secondary"
              className="min-h-14 w-full px-10 text-base sm:w-auto"
            >
              {d.ctaTester}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
