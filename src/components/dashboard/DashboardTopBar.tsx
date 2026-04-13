"use client";

import { Bell, Menu, Search } from "lucide-react";
import { motion } from "framer-motion";

export function DashboardTopBar({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0A0A0B]/80 px-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/80 transition-colors hover:border-accent/30 hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <motion.div
          key={title}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="text-lg font-semibold tracking-tight text-white md:text-xl">
            {title}
          </h1>
          <p className="hidden text-xs text-white/40 sm:block">
            Helia Suite workspace
          </p>
        </motion.div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition-all hover:border-white/15 hover:text-white/85 sm:flex"
          aria-label="Search"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition-all hover:border-white/15 hover:text-white/85"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(212,175,55,0.7)]" />
        </button>
        <div
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent/90 to-amber-700/80 text-xs font-bold text-[#0A0A0B] shadow-[0_0_20px_-4px_rgba(212,175,55,0.55)] ring-2 ring-white/10"
          title="User"
        >
          HS
        </div>
      </div>
    </header>
  );
}
