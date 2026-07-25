"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { adminTitleForPath } from "./admin-nav";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = adminTitleForPath(pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-[#0A0A0B] text-white">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-accent/[0.04] blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-accent/[0.03] blur-[90px]" />
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 w-[min(17.5rem,88vw)] transition-transform duration-300 ease-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <AdminSidebar
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      <div className="relative flex min-h-screen flex-col lg:pl-[17.5rem]">
        <AdminTopBar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="relative flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl pb-10">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
