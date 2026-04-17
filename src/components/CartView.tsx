"use client";

import { useCart } from "@/providers/cart-provider";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import Image from "next/image";
import Link from "next/link";

export function CartView() {
  const reduce = useReducedMotionHydrationSafe();
  const { lineItems, setQuantity, subtotal, clear } = useCart();
  const basePath = useMarketBasePath();

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
          Bag
        </p>
        <h1 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          Cart
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
          Demo cart — no payment or shipping.
        </p>
      </motion.header>

      {lineItems.length === 0 ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-6 text-center [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
        >
          <p className="text-sm font-medium text-zinc-600">Your bag is empty.</p>
          <Link
            href={withMarketBasePath(basePath, "/shop")}
            className="mt-4 inline-flex text-sm font-semibold text-orange-600"
          >
            Browse catalog
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {lineItems.map(({ product, quantity }, index) => (
              <motion.div
                key={product.id}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 380, damping: 34, delay: index * 0.05 }
                }
                className="flex gap-3 rounded-2xl bg-white p-3 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
              >
                <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="76px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-900">
                    {product.name}
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-zinc-700">
                    {formatMoney(product.price)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 transition active:scale-95"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-xs font-semibold">{quantity}</span>
                    <button
                      type="button"
                      className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 transition active:scale-95"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-[11px] font-semibold text-zinc-400"
                      onClick={() => setQuantity(product.id, 0)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-2xl bg-white p-4 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-500">Subtotal</span>
              <span className="text-base font-semibold tabular-nums text-zinc-900">
                {formatMoney(subtotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => clear()}
              className="mt-4 w-full rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.99]"
            >
              Clear bag (demo)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
