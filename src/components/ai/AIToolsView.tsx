"use client";

import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Lightbulb, Mail, PenLine, TrendingUp } from "lucide-react";
import Link from "next/link";

const sectionEase = [0.16, 1, 0.3, 1] as const;

const TOOLS = [
  {
    title: "Copywriter AI",
    description: "Generate high-converting texts",
    Icon: PenLine,
  },
  {
    title: "Sales AI",
    description: "Boost your conversions",
    Icon: TrendingUp,
  },
  {
    title: "Idea Generator",
    description: "Find new business ideas",
    Icon: Lightbulb,
  },
  {
    title: "Email Assistant",
    description: "Write professional emails",
    Icon: Mail,
  },
] as const;

export function AIToolsView() {
  const reduce = useReducedMotionHydrationSafe();
  const basePath = useMarketBasePath();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-6 pb-10 pt-[3.35rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(139,92,246,0.16),transparent),radial-gradient(ellipse_70%_50%_at_100%_25%,rgba(59,130,246,0.11),transparent)]"
      />
      <div className="relative z-10">
        <motion.header
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }}
          className="mb-6"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-violet-600/90">Tools</p>
          <h1 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
            AI Tools
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
            Pick a module — static demo, tap to return to chat.
          </p>
        </motion.header>

        <ul className="space-y-3">
          {TOOLS.map(({ title, description, Icon }, i) => (
            <motion.li
              key={title}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduce ? { duration: 0 } : { duration: 0.45, ease: sectionEase, delay: 0.06 * i }
              }
            >
              <Link
                href={withMarketBasePath(basePath, "/shop")}
                className="group block rounded-2xl border border-white/55 bg-white/50 p-4 shadow-[0_18px_44px_-30px_rgba(79,70,229,0.45)] ring-1 ring-violet-200/35 backdrop-blur-xl transition duration-300 hover:border-violet-300/60 hover:bg-white/65 hover:shadow-[0_22px_52px_-28px_rgba(79,70,229,0.55)] active:scale-[0.99]"
              >
                <motion.div
                  whileHover={reduce ? undefined : { scale: 1.015 }}
                  whileTap={reduce ? undefined : { scale: 0.995 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  className="flex items-start gap-3"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-blue-500/20 text-violet-700 ring-1 ring-violet-300/40">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="block text-[15px] font-semibold tracking-tight text-zinc-950">
                      {title}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-zinc-600">
                      {description}
                    </span>
                  </span>
                </motion.div>
              </Link>
            </motion.li>
          ))}
        </ul>

        <Link
          href={withMarketBasePath(basePath, "/shop")}
          className="mt-8 inline-flex w-full justify-center rounded-full border border-white/50 bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-violet-500/30 ring-1 ring-white/25 transition hover:brightness-110 active:scale-[0.98]"
        >
          Back to chat
        </Link>
      </div>
    </div>
  );
}
