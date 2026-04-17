"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/providers/cart-provider";
import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { useShellNav } from "@/lib/shell-nav";

export function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const basePath = useMarketBasePath();
  const { items, homeHref, detailPathPrefix, showCartCount } = useShellNav();
  const scopedPathname =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;

  const layoutId = `bottom-nav-pill-${basePath || "root"}`;

  return (
    <nav className="shrink-0 border-t border-zinc-200/90 bg-white/90 px-1 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))] pt-1.5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex max-w-md items-stretch justify-between gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === homeHref
              ? scopedPathname === "/" ||
                scopedPathname === homeHref ||
                scopedPathname.startsWith(detailPathPrefix)
              : href === "/admin"
                ? scopedPathname === "/admin" || scopedPathname.startsWith("/admin/")
                : scopedPathname === href || scopedPathname.startsWith(`${href}/`);
          return (
            <Link
              key={`${label}-${href}`}
              href={withMarketBasePath(basePath, href)}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[9px] font-semibold tracking-wide text-zinc-500 transition-colors hover:text-zinc-800 sm:text-[10px]"
            >
              {active ? (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-x-1 inset-y-1 rounded-2xl bg-zinc-950/[0.06]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <span className="relative">
                  <Icon
                    className={`h-[20px] w-[20px] sm:h-[22px] sm:w-[22px] ${active ? "text-zinc-900" : "text-zinc-400"}`}
                    strokeWidth={active ? 2.25 : 1.85}
                  />
                  {showCartCount && href === "/cart" && itemCount > 0 ? (
                    <span className="absolute -right-2 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-orange-500 px-0.5 text-[9px] font-bold text-white shadow-sm">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  ) : null}
                </span>
                <span className={active ? "text-zinc-900" : "text-zinc-500"}>{label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
