"use client";

import type { Product } from "@/data/products";
import {
  aiBadgeToneClasses,
  getAiProductBadge,
} from "@/lib/ai-product-badges";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/providers/cart-provider";
import { useMemo } from "react";

const springIn = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.7 };
const springHover = { type: "spring" as const, stiffness: 520, damping: 34, mass: 0.45 };

export type RailBadge =
  | "ai"
  | "trending"
  | "bestseller"
  | "recommended"
  | "similar";

const badgeCopy: Record<RailBadge, string> = {
  ai: "AI Pick",
  trending: "Hot",
  bestseller: "Top seller",
  recommended: "For you",
  similar: "Similar",
};

type ProductCardProps = {
  product: Product;
  motionIndex?: number;
  variant?: "grid" | "rail";
  railBadge?: RailBadge;
  showQuickAdd?: boolean;
  /** Helia Sense-style pill on grid cards, or secondary pill on rails. Default: true. */
  showDynamicBadge?: boolean;
};

export function ProductCard({
  product,
  motionIndex = 0,
  variant = "grid",
  railBadge,
  showQuickAdd = true,
  showDynamicBadge = true,
}: ProductCardProps) {
  const isRail = variant === "rail";
  const reduce = useReducedMotionHydrationSafe();
  const { addItem } = useCart();
  const basePath = useMarketBasePath();
  const href = withMarketBasePath(basePath, `/product/${product.id}`);
  const aiBadge = useMemo(() => getAiProductBadge(product.id), [product.id]);
  const tone = aiBadgeToneClasses[aiBadge.tone];
  const showPrimaryDynamic = showDynamicBadge && !railBadge;
  const showSecondaryDynamic = showDynamicBadge && Boolean(railBadge);

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={
        reduce
          ? { duration: 0 }
          : { ...springIn, delay: motionIndex * 0.065 }
      }
      whileHover={
        reduce
          ? undefined
          : {
              y: -4,
              scale: 1.012,
              transition: springHover,
            }
      }
      whileTap={reduce ? undefined : { scale: 0.985, transition: { duration: 0.15 } }}
      className={`group relative overflow-hidden rounded-2xl bg-white [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.035] transition-[box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:[box-shadow:var(--shadow-card-hover)] ${isRail ? "w-[156px] shrink-0 snap-start" : "w-full"}`}
    >
      <div className="relative">
        <Link
          href={href}
          scroll
          className="relative block outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <div
            className={`relative w-full overflow-hidden bg-zinc-100 ${isRail ? "aspect-[4/5]" : "aspect-square"}`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/[0.06] via-transparent to-white/[0.12] opacity-80"
            />
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes={isRail ? "156px" : "(max-width: 400px) 50vw, 186px"}
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.05]"
              priority={motionIndex < 2}
            />
            {product.isRecommended ? (
              <span className="absolute right-2.5 top-2.5 z-20 inline-flex items-center rounded-full border border-violet-200/70 bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-900 shadow-[0_10px_26px_-14px_rgba(124,58,237,0.5)] ring-1 ring-violet-500/10 backdrop-blur-md">
                AI Recommended
              </span>
            ) : null}
            {railBadge ? (
              <span className="absolute left-2.5 top-2.5 z-20 rounded-full border border-white/20 bg-zinc-950/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] backdrop-blur-md">
                {badgeCopy[railBadge]}
              </span>
            ) : null}
            {showPrimaryDynamic ? (
              <motion.span
                initial={reduce ? false : { opacity: 0, scale: 0.92, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 28, delay: 0.04 }
                }
                className={`absolute left-2.5 top-2.5 z-20 max-w-[calc(100%-1.25rem)] truncate rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none shadow-lg backdrop-blur-md ${tone.chip} ${tone.glow}`}
              >
                <motion.span
                  className="block truncate"
                  animate={
                    reduce ? undefined : { opacity: [0.9, 1, 0.9], scale: [1, 1.03, 1] }
                  }
                  transition={
                    reduce
                      ? undefined
                      : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  }
                >
                  {aiBadge.label}
                </motion.span>
              </motion.span>
            ) : null}
            {showSecondaryDynamic ? (
              <motion.span
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 380, damping: 30, delay: 0.05 }
                }
                className={`absolute bottom-2.5 left-2.5 z-20 max-w-[min(7.5rem,calc(100%-3rem))] truncate rounded-full border px-2 py-0.5 text-[9px] font-semibold leading-tight text-white shadow-md backdrop-blur-sm ${tone.chip}`}
              >
                <motion.span
                  className="block truncate"
                  animate={
                    reduce ? undefined : { opacity: [0.88, 1, 0.88] }
                  }
                  transition={
                    reduce
                      ? undefined
                      : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                  }
                >
                  {aiBadge.label}
                </motion.span>
              </motion.span>
            ) : null}
          </div>
        </Link>
        {showQuickAdd ? (
          <motion.button
            type="button"
            aria-label={`Add ${product.name} to cart`}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem(product.id, 1);
            }}
            className="absolute bottom-2.5 right-2.5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-[0_10px_28px_-12px_rgba(0,0,0,0.35)] ring-1 ring-zinc-900/10 backdrop-blur-md transition hover:bg-white"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </motion.button>
        ) : null}
      </div>
      <Link
        href={href}
        scroll
        className={`relative block border-t border-zinc-900/[0.04] bg-white/95 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20 ${isRail ? "space-y-1 px-3 py-3" : "space-y-1.5 px-3.5 py-3.5"}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {product.category}
        </p>
        <h3
          className={`line-clamp-2 font-semibold tracking-tight text-zinc-900 ${isRail ? "text-[12px] leading-snug" : "text-[13px] leading-snug"}`}
        >
          {product.name}
        </h3>
        <p
          className={`font-semibold tabular-nums tracking-tight text-zinc-700 ${isRail ? "text-[13px]" : "text-sm"}`}
        >
          {formatPrice(product.price)}
        </p>
      </Link>
    </motion.article>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
