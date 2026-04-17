"use client";

import { StoreCard } from "@/components/StoreCard";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { useCatalog } from "@/providers/catalog-provider";

export function StoresView() {
  const reduce = useReducedMotionHydrationSafe();
  const { stores } = useCatalog();

  return (
    <div className="px-6 pb-8 pt-[3.35rem]">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }
        }
        className="mb-6"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          AI-Powered App Systems
        </p>
        <h1 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          Stores
        </h1>
        <p className="mt-2 max-w-[20rem] text-[13px] leading-relaxed text-zinc-500">
          Verified sellers with Helia trust signals — demo data only.
        </p>
      </motion.header>

      <div className="space-y-3">
        {stores.map((store, index) => (
          <StoreCard key={store.id} store={store} index={index} />
        ))}
      </div>
    </div>
  );
}
