"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { MotionSection } from "@/components/MotionSection";
import { WHATSAPP_URL } from "@/config/site";
import type { Locale } from "@/config/i18n";
import type { Dictionary } from "@/lib/dictionaries/types";
import {
  formatUsdRange,
  PRICING_ESTIMATOR_OPTIONS,
} from "@/data/pricing-estimator";

export function PricingEstimatorSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const copy = dict.home;
  const [selectedId, setSelectedId] = useState(PRICING_ESTIMATOR_OPTIONS[0].id);

  const selected = useMemo(
    () =>
      PRICING_ESTIMATOR_OPTIONS.find((o) => o.id === selectedId) ??
      PRICING_ESTIMATOR_OPTIONS[0],
    [selectedId]
  );

  const rangeText = formatUsdRange(selected.min, selected.max);
  const optionLabel = (o: (typeof PRICING_ESTIMATOR_OPTIONS)[number]) =>
    locale === "tr" ? o.labelTr : o.labelEn;

  return (
    <MotionSection
      id="pricing"
      className="scroll-mt-24 border-y border-white/[0.06] bg-[#070708] py-20 md:scroll-mt-28 md:py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />
      <div className="container-main relative">
        <div className="pointer-events-none absolute -left-40 top-20 h-72 w-72 rounded-full bg-violet-600/[0.07] blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 bottom-10 h-64 w-64 rounded-full bg-blue-500/[0.06] blur-[90px]" />

        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {copy.pricingEstimatorTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/55 md:text-lg">
            {copy.pricingEstimatorSubtitle}
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-white/40">
              {copy.pricingEstimatorPickLabel}
            </p>
            <div className="grid max-h-[min(70vh,640px)] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
              {PRICING_ESTIMATOR_OPTIONS.map((opt) => {
                const active = opt.id === selectedId;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedId(opt.id)}
                    className={`rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 md:px-5 md:py-4 md:text-[15px] ${
                      active
                        ? "border-accent/45 bg-gradient-to-br from-white/[0.08] to-white/[0.02] text-white shadow-[0_0_0_1px_rgba(212,175,55,0.25),0_20px_50px_-28px_rgba(99,102,241,0.2)] ring-1 ring-accent/30"
                        : "border-white/10 bg-[#121214]/90 text-white/70 hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-white/90"
                    }`}
                  >
                    {optionLabel(opt)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:pl-2">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#161618] to-[#101012] p-8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.85)] md:p-10">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                {copy.pricingEstimatorResultTitle}
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-5"
                >
                  <p className="text-balance text-3xl font-semibold tracking-tight text-white md:text-[2rem] md:leading-tight">
                    {rangeText}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white/50">
                    {optionLabel(selected)}
                  </p>
                </motion.div>
              </AnimatePresence>
              <p className="mt-8 text-sm leading-relaxed text-white/50">
                {copy.pricingEstimatorDisclaimer}
              </p>
              <Button
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="mt-8 w-full min-h-12 text-sm font-semibold md:mt-10"
              >
                {copy.pricingEstimatorCta}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
