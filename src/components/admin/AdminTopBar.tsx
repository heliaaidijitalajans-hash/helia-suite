"use client";

import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutHeliaCloud } from "@/services/cloud/auth";

export function AdminTopBar({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await logoutHeliaCloud();
      router.replace("/login?next=/admin");
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
            Helia Suite Admin
          </p>
        </motion.div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <Link
          href="/dashboard"
          className="hidden rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 transition-colors hover:border-white/20 hover:text-white/85 sm:inline-flex"
        >
          Customer Platform
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={busy}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition-all hover:border-red-400/35 hover:text-red-100/90 disabled:opacity-60"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
