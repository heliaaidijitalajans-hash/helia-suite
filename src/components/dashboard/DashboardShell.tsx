"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { dashboardTitleForPath } from "./dashboard-nav";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";

export function DashboardShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = dashboardTitleForPath(pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#0A0A0B] text-white md:min-h-[calc(100vh-5rem)]">
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      {/* Fixed sidebar — full height under site header; does not share row with footer */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-50 w-[min(17.5rem,88vw)] transition-transform duration-300 ease-out md:top-20 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <DashboardSidebar
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* Content column only — offset by sidebar on lg+; footer lives here */}
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col lg:pl-[17.5rem] md:min-h-[calc(100vh-5rem)]">
        <DashboardTopBar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="relative flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl pb-8 md:pb-10">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-4 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] md:rounded-[2rem] md:p-7"
            >
              {children}
            </motion.div>
          </div>
        </main>
        {footer ? (
          <div className="relative mt-auto w-full shrink-0">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
