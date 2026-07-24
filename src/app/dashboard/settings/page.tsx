"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90"
      >
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Account</h2>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm text-white/60">
          <p>
            Manage organizations and API keys from the sidebar. Helia does not
            invent placeholder workspace data.
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard/organizations"
                className="text-accent hover:underline"
              >
                Organizations
              </Link>{" "}
              — create or select your tenant
            </li>
            <li>
              <Link
                href="/dashboard/api-keys"
                className="text-accent hover:underline"
              >
                API Keys
              </Link>{" "}
              — issue capability-aware credentials
            </li>
          </ul>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90"
      >
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Preferences</h2>
        </div>
        <p className="px-6 py-5 text-sm text-white/50">
          Notification and billing preference controls will appear here when
          connected to your organization plan. No mock toggles are shown.
        </p>
      </motion.section>
    </div>
  );
}
