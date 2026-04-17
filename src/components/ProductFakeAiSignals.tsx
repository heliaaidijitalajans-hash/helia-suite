"use client";

import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Flame, Package, Users } from "lucide-react";

const signals = [
  {
    id: "viewers",
    text: "12 people are viewing this",
    Icon: Users,
  },
  {
    id: "stock",
    text: "Only 3 left in stock",
    Icon: Package,
  },
  {
    id: "trending",
    text: "Trending now",
    Icon: Flame,
  },
] as const;

/**
 * Simulated “live” merchandising signals — static demo copy, not real telemetry.
 */
export function ProductFakeAiSignals() {
  const reduce = useReducedMotionHydrationSafe();

  return (
    <div
      role="status"
      className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white p-3.5 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] ring-1 ring-zinc-900/[0.04]"
    >
      <p className="sr-only">
        Simulated activity for demo purposes only — not real visitor counts or inventory.
      </p>
      <ul className="space-y-2.5">
        {signals.map(({ id, text, Icon }, index) => (
          <motion.li
            key={id}
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 32, delay: 0.06 + index * 0.07 }
            }
            className="flex items-center gap-2.5 text-[12px] font-medium leading-snug text-zinc-700"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-zinc-900/[0.05]">
              <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0">{text}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
