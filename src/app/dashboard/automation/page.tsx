"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

const FLOWS = [
  {
    title: "Lead routing",
    body: "Score inbound leads and assign owners by territory and capacity.",
    runs: "12.4k runs",
    icon: Zap,
  },
  {
    title: "Lifecycle sync",
    body: "Mirror CRM stages to product analytics without manual exports.",
    runs: "8.1k runs",
    icon: GitBranch,
  },
  {
    title: "Retention nudges",
    body: "Trigger contextual messages when usage drops below thresholds.",
    runs: "5.6k runs",
    icon: ArrowRight,
  },
];

export default function DashboardAutomationPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <p className="max-w-2xl text-sm leading-relaxed text-white/50">
        Automation runs as first-class workflows—visually orchestrated, audited,
        and safe to iterate. Below is a static preview of how modules surface in
        the console.
      </p>
      <div className="grid gap-5 md:grid-cols-3">
        {FLOWS.map((flow, i) => {
          const Icon = flow.icon;
          return (
            <motion.article
              key={flow.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90 p-6",
                "shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm transition-shadow hover:border-accent/20 hover:shadow-[0_24px_60px_-24px_rgba(212,175,55,0.1)]"
              )}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-semibold text-white">
                {flow.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {flow.body}
              </p>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-white/35">
                {flow.runs} · 30d
              </p>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
