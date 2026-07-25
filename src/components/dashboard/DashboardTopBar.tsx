"use client";

import Link from "next/link";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutHeliaCloud } from "@/services/cloud/auth";
import { usePlatformLocale } from "@/components/platform/PlatformLocaleProvider";

export function DashboardTopBar({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const { ui } = usePlatformLocale();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await logoutHeliaCloud();
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0A0A0B]/80 px-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/80 transition-colors hover:border-accent/30 hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label={ui.shell.openMenu}
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
            {ui.shell.heliaApiPlatform}
          </p>
        </motion.div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition-all hover:border-white/15 hover:text-white/85 sm:flex"
          aria-label={ui.shell.search}
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition-all hover:border-white/15 hover:text-white/85"
          aria-label={ui.shell.notifications}
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={busy}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition-all hover:border-red-400/35 hover:text-red-100/90 disabled:opacity-60"
          aria-label={ui.shell.logout}
          title={ui.shell.logout}
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <Link
          href="/dashboard/profile"
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent/90 to-amber-700/80 text-xs font-bold text-[#0A0A0B] shadow-[0_0_20px_-4px_rgba(212,175,55,0.55)] ring-2 ring-white/10 transition-opacity hover:opacity-90"
          title={ui.dashboardNav.profile}
          aria-label={ui.shell.openProfile}
        >
          H
        </Link>
      </div>
    </header>
  );
}
