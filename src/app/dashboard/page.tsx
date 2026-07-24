"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  KeyRound,
  MessageSquare,
  Plug,
  Radar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const PILLARS = [
  { label: "API Keys", icon: KeyRound },
  { label: "AI Chat", icon: MessageSquare },
  { label: "Monitoring", icon: Radar },
  { label: "Integrations", icon: Plug },
] as const;

const ONBOARDING = [
  {
    step: "1",
    title: "Generate API Key",
    body: "Issue a capability-scoped key for your workspace.",
    href: "/dashboard/api-keys",
  },
  {
    step: "2",
    title: "Read Documentation",
    body: "Learn auth, REST, SDK, webhooks, and rate limits.",
    href: "/dashboard/documentation",
  },
  {
    step: "3",
    title: "Integrate",
    body: "Connect Helia to Next.js, Node, Flutter, and more.",
    href: "/dashboard/integrations",
  },
  {
    step: "4",
    title: "Monitor Usage",
    body: "Track requests and talk to Helia Chat from your workspace.",
    href: "/dashboard/usage",
  },
] as const;

export default function DashboardOverviewPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent/90">
          Helia API Platform
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Welcome to Helia
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
          Helia is an AI platform for your products. Manage API keys, chat with
          Helia Brain, monitor usage, and connect applications — from one
          customer portal.
        </p>
        <ul className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-2 pt-1">
          {PILLARS.map(({ label, icon: Icon }) => (
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
            Generate API Key
          </Button>
          <Button
            href="/dashboard/documentation"
            variant="secondary"
            className="min-h-11 border-white/12 px-6 text-sm font-semibold"
          >
            Documentation
          </Button>
          <Button
            href="/dashboard/helia-chat"
            variant="ghost"
            className="min-h-11 px-6 text-sm font-semibold"
          >
            Helia Chat
          </Button>
        </div>
      </motion.div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Get started</h3>
            <p className="mt-1 text-xs text-white/40">
              Generate API Key → Read Documentation → Integrate → Monitor Usage
            </p>
          </div>
        </div>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ONBOARDING.map((item, i) => (
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
                  Step {item.step}
                </span>
                <span className="mt-2 text-sm font-medium text-white">
                  {item.title}
                </span>
                <span className="mt-1.5 flex-1 text-xs leading-relaxed text-white/45">
                  {item.body}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-white/50 group-hover:text-accent">
                  Open
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
          <p className="mt-3 text-sm font-semibold text-white">Documentation</p>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            Authentication, REST API, SDK, webhooks, examples, and rate limits.
          </p>
        </Link>
        <Link
          href="/dashboard/integrations"
          className="rounded-xl border border-white/[0.08] bg-[#161618]/90 p-5 transition-colors hover:border-accent/25"
        >
          <Plug className="h-5 w-5 text-accent" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold text-white">Integrations</p>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            Next.js, Node.js, Express, Flutter, React Native, and custom REST.
          </p>
        </Link>
      </section>
    </div>
  );
}
