"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { defaultLocale } from "@/config/i18n";
import { WHATSAPP_URL } from "@/config/site";
import { staggerChild, staggerParent } from "@/lib/motion";

const INTRO =
  "This is a custom system example built for businesses like yours.";

const VALUE_TITLE = "What This System Does";

const VALUE_POINTS = [
  "Increase customer retention",
  "Automate daily operations",
  "Improve user experience",
  "Help your business grow",
];

const POSITIONING =
  "Custom-built systems tailored to your business needs.";

const CTA_PRIMARY = "Request Your Custom System";
const CTA_SECONDARY = "Contact via WhatsApp";

const TRUST = "We respond within 24 hours. No hidden fees.";

const LEAD_HREF = `/${defaultLocale}#lead-demo`;

export function DashboardDemoIntro() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl text-center text-base leading-relaxed text-white/60 md:text-lg"
    >
      {INTRO}
    </motion.p>
  );
}

export function DashboardDemoCanvas({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto w-full max-w-6xl rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-4 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] md:rounded-[2rem] md:p-7">
      <div
        className="pointer-events-none absolute inset-x-8 top-3 hidden h-1 rounded-full bg-white/[0.06] sm:block"
        aria-hidden
      />
      <div className="relative pt-1">{children}</div>
    </div>
  );
}

export function DashboardDemoMarketing() {
  return (
    <div className="mx-auto max-w-2xl space-y-14 text-center">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="space-y-6"
      >
        <motion.h2
          variants={staggerChild}
          className="text-2xl font-semibold tracking-tight text-white md:text-3xl"
        >
          {VALUE_TITLE}
        </motion.h2>
        <motion.ul
          variants={staggerChild}
          className="mx-auto max-w-md space-y-3.5 text-left text-sm leading-relaxed text-white/65 md:text-base"
        >
          {VALUE_POINTS.map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              <span>{line}</span>
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-xl text-lg font-medium leading-relaxed text-white/80 md:text-xl"
      >
        {POSITIONING}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center"
      >
        <Button
          href={LEAD_HREF}
          className="min-h-12 px-8 text-sm font-semibold"
        >
          {CTA_PRIMARY}
        </Button>
        <Button
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          className="min-h-12 border-white/12 px-8 text-sm font-semibold"
        >
          {CTA_SECONDARY}
        </Button>
      </motion.div>

      <p className="text-center text-xs leading-relaxed text-white/45 md:text-sm">
        {TRUST}
      </p>
    </div>
  );
}
