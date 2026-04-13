"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  delay?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.015 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90 p-6 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)]",
        "backdrop-blur-sm transition-shadow duration-300 hover:border-accent/25 hover:shadow-[0_24px_60px_-24px_rgba(212,175,55,0.12)]"
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/[0.06] blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-[1.75rem]">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-xs font-medium text-accent/90">{hint}</p>
          ) : null}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent shadow-inner ring-1 ring-white/[0.04]">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
      </div>
    </motion.article>
  );
}
