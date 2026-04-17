"use client";

import { ProductCard } from "@/components/ProductCard";
import { ProductFakeAiSignals } from "@/components/ProductFakeAiSignals";
import { getProductDescription } from "@/data/products";
import { saveLastViewedProductId } from "@/lib/browse-signals";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { useCatalog } from "@/providers/catalog-provider";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { ChevronLeft, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/providers/cart-provider";

export function ProductDetailView({ productId }: { productId: string }) {
  const router = useRouter();
  const reduce = useReducedMotionHydrationSafe();
  const { addItem } = useCart();
  const { getProductById, getSimilarProducts, getStoreName } = useCatalog();
  const basePath = useMarketBasePath();
  const [addedPulse, setAddedPulse] = useState(false);

  const product = useMemo(() => getProductById(productId), [getProductById, productId]);
  const similar = useMemo(
    () => (product ? getSimilarProducts(product.id, 3) : []),
    [getSimilarProducts, product],
  );

  useEffect(() => {
    if (product) saveLastViewedProductId(product.id);
  }, [product]);

  if (!product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-zinc-600">Product not found.</p>
        <Link
          href={withMarketBasePath(basePath, "/shop")}
          className="text-sm font-semibold text-orange-600"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const storeName = getStoreName(product.storeId);
  const description = getProductDescription(product, storeName);

  const onAddToCart = () => {
    addItem(product.id, 1);
    setAddedPulse(true);
    window.setTimeout(() => setAddedPulse(false), 900);
  };

  return (
    <div className="pb-4">
      <div className="relative -mx-6">
        <div className="relative aspect-[4/5] w-full bg-zinc-100">
          <motion.button
            type="button"
            aria-label="Back"
            whileTap={{ scale: 0.94 }}
            onClick={() => router.back()}
            className="absolute left-4 top-[3.25rem] z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.35)] ring-1 ring-zinc-900/10 backdrop-blur-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 28 }
            }
            className="relative h-full w-full"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="400px"
              className="object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10"
            />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32, delay: 0.05 }
        }
        className="space-y-4 px-6 pb-6 pt-5"
      >
        <h1 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          {product.name}
        </h1>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
          {formatPrice(product.price)}
        </p>
        <Link
          href={withMarketBasePath(basePath, `/stores/${product.storeId}`)}
          className="inline-flex text-[13px] font-semibold text-orange-600 transition hover:text-orange-700"
        >
          {storeName}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {product.isRecommended ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200/80 bg-gradient-to-r from-violet-600/10 via-fuchsia-500/10 to-orange-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-900 ring-1 ring-violet-500/15">
              <Sparkles className="h-3 w-3" aria-hidden />
              AI Recommended
            </span>
          ) : null}
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
            {product.category}
          </span>
        </div>

        <ProductFakeAiSignals />

        <p className="text-[13px] leading-relaxed text-zinc-600">{description}</p>

        <div className="relative pt-1">
          <motion.div
            aria-hidden
            initial={false}
            animate={{ opacity: addedPulse ? 1 : 0, y: addedPulse ? 0 : 6 }}
            className="pointer-events-none absolute -top-8 left-0 right-0 flex justify-center"
          >
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
              Added to bag
            </span>
          </motion.div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={onAddToCart}
            className="flex w-full items-center justify-center rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-[0_18px_44px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/10 transition hover:bg-zinc-800"
          >
            Add to Cart
          </motion.button>
        </div>
      </motion.div>

      {similar.length ? (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 32, delay: 0.08 }
          }
          className="space-y-4 px-6 pb-8"
        >
          <div className="space-y-1">
            <h2 className="text-[0.9375rem] font-semibold tracking-tight text-zinc-900">
              You may also like
            </h2>
            <p className="text-[12px] text-zinc-500">Curated from the same catalog</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {similar.map((p, index) => (
              <ProductCard
                key={p.id}
                product={p}
                motionIndex={index}
                variant="grid"
                showQuickAdd
              />
            ))}
          </div>
        </motion.section>
      ) : null}
    </div>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
