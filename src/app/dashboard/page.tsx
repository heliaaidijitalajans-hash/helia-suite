"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  KeyRound,
  Plug,
  Radar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { usePlatformLocale } from "@/components/platform/PlatformLocaleProvider";

export default function DashboardOverviewPage() {
  const { ui, locale } = usePlatformLocale();
  const h = ui.dashboardHome;

  const pillars = [
    { label: h.pillarApiKeys, icon: KeyRound },
    { label: h.pillarMonitoring, icon: Radar },
    { label: h.pillarIntegrations, icon: Plug },
    { label: h.pillarDocs, icon: BookOpen },
  ] as const;

  const onboarding = [
    {
      step: "1",
      title: h.step1Title,
      body: h.step1Body,
      href: "/dashboard/api-keys",
    },
    {
      step: "2",
      title: h.step2Title,
      body: h.step2Body,
      href: "/dashboard/documentation",
    },
    {
      step: "3",
      title: h.step3Title,
      body: h.step3Body,
      href: "/dashboard/integrations",
    },
    {
      step: "4",
      title: h.step4Title,
      body: h.step4Body,
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
        <ul className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-2 pt-1">
          {pillars.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70"
            >
              <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
              {label}
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center">
          <Button
            href="/dashboard/api-keys"
            className="min-h-11 px-6 text-sm font-semibold"
          >
            {h.ctaKeys}
          </Button>
          <Button
            href="/dashboard/documentation"
            variant="secondary"
            className="min-h-11 border-white/12 px-6 text-sm font-semibold"
          >
            {ui.dashboardNav.documentation}
          </Button>
          <Button
            href="/dashboard/integrations"
            variant="ghost"
            className="min-h-11 px-6 text-sm font-semibold"
          >
            {ui.dashboardNav.integrations}
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
              {h.step1Title} → {h.step2Title} → {h.step3Title} → {h.step4Title}
            </p>
          </div>
        </div>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {onboarding.map((item, i) => (
            <motion.li
              key={item.step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "group flex h-full flex-col rounded-xl border border-white/[0.08] bg-[#161618]/90 p-4",
                  "transition-colors hover:border-accent/25 hover:bg-white/[0.03]"
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent/80">
                  {stepLabel} {item.step}
                </span>
                <span className="mt-2 text-sm font-medium text-white">
                  {item.title}
                </span>
                <span className="mt-1.5 flex-1 text-xs leading-relaxed text-white/45">
                  {item.body}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-white/50 group-hover:text-accent">
                  {openLabel}
                  <ArrowRight className="h-3 w-3" strokeWidth={2} />
                </span>
              </Link>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/documentation"
          className="rounded-xl border border-white/[0.08] bg-[#161618]/90 p-5 transition-colors hover:border-accent/25"
        >
          <BookOpen className="h-5 w-5 text-accent" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold text-white">
            {ui.dashboardNav.documentation}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            {h.step2Body}
          </p>
        </Link>
        <Link
          href="/dashboard/integrations"
          className="rounded-xl border border-white/[0.08] bg-[#161618]/90 p-5 transition-colors hover:border-accent/25"
        >
          <Plug className="h-5 w-5 text-accent" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold text-white">
            {ui.dashboardNav.integrations}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            {h.step3Body}
          </p>
        </Link>
      </section>
    </div>
  );
}
