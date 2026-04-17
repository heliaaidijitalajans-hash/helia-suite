"use client";

import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import type { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Centered device chrome — refined bezel, notch, inner display with depth.
 */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  const reduce = useReducedMotionHydrationSafe();

  return (
    <div className="relative flex min-h-full w-full flex-1 items-center justify-center overflow-hidden px-6 py-12 sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_50%_-10%,rgba(255,255,255,0.55),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_50%,rgba(99,102,241,0.06),transparent_50%),radial-gradient(ellipse_60%_45%_at_0%_80%,rgba(251,146,60,0.05),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
        }}
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 220, damping: 26, mass: 0.85 }
        }
        className={`relative z-10 w-full max-w-[372px] ${className ?? ""}`.trim()}
        data-device="phone-frame"
      >
        <div className="rounded-[2.85rem] border-[11px] border-zinc-950 bg-zinc-950 shadow-[var(--shadow-device)] ring-1 ring-white/[0.12]">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-[14px]">
            <div className="h-[30px] w-[108px] rounded-full bg-black ring-1 ring-white/[0.08]" />
          </div>
          <div className="overflow-hidden rounded-[2.05rem] bg-[#fafafa] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="flex min-h-0 max-h-[min(728px,78dvh)] min-h-[min(648px,72dvh)] flex-col">
              {children}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
