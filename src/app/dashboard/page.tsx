"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { usePlatformLocale } from "@/components/platform/PlatformLocaleProvider";

export default function DashboardOverviewPage() {
  const { ui, locale } = usePlatformLocale();
  const h = ui.dashboardHome;

  const onboarding = [
    {
      step: "1",
      title: h.step1Title,
      body: h.step1Body,
      href: "/dashboard/profile",
    },
    {
      step: "2",
      title: h.step2Title,
      body: h.step2Body,
      href: "/dashboard/settings",
    },
    {
      step: "3",
      title: h.step3Title,
      body: h.step3Body,
      href: "/dashboard/usage",
    },
  ] as const;

  const openLabel = locale === "tr" ? "Aç" : "Open";
  const stepLabel = locale === "tr" ? "Adım" : "Step";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent/90">
          {h.eyebrow}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {h.title}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
          {h.body}
        </p>
        <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center">
          <Button
            href="/dashboard/profile"
            className="min-h-11 px-6 text-sm font-semibold"
          >
            {ui.dashboardNav.profile}
          </Button>
          <Button
            href="/dashboard/settings"
            variant="secondary"
            className="min-h-11 border-white/12 px-6 text-sm font-semibold"
          >
            {ui.dashboardNav.settings}
          </Button>
        </div>
      </motion.div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {h.onboardingTitle}
            </h3>
            <p className="mt-1 text-xs text-white/40">
              {h.step1Title} → {h.step2Title} → {h.step3Title}
            </p>
          </div>
        </div>
        <ol className="grid gap-3 md:grid-cols-3">
          {onboarding.map((item) => (
            <li key={item.step}>
              <Link
                href={item.href}
                className={cn(
                  "group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5",
                  "transition hover:border-accent/35 hover:bg-white/[0.05]"
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent/80">
                  {stepLabel} {item.step}
                </span>
                <span className="mt-2 text-sm font-semibold text-white">
                  {item.title}
                </span>
                <span className="mt-2 flex-1 text-xs leading-relaxed text-white/45">
                  {item.body}
                </span>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent">
                  {openLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
