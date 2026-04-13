"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { SITE_NAME } from "@/config/site";
import { dashboardNav } from "./dashboard-nav";

export function DashboardSidebar({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col border-r border-white/[0.08] bg-[#0d0d0f]/95 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 border-b border-white/[0.06] px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-sm font-bold tracking-tight text-accent ring-1 ring-accent/25">
          H
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">
            {SITE_NAME}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
            Console
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Dashboard">
        {dashboardNav.map((item, i) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-white/[0.07] text-white shadow-[0_0_24px_-8px_rgba(212,175,55,0.35)] ring-1 ring-accent/20"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/90"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active ? "text-accent" : "text-white/40 group-hover:text-white/70"
                  )}
                  strokeWidth={1.75}
                />
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>
      <div className="border-t border-white/[0.06] p-4">
        <p className="text-center text-[11px] leading-relaxed text-white/30">
          Demo interface — no live data
        </p>
      </div>
    </div>
  );
}
