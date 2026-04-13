"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type SettingsRow =
  | { label: string; value: string }
  | { label: string; on: boolean };

const SECTIONS: { title: string; rows: SettingsRow[] }[] = [
  {
    title: "Workspace",
    rows: [
      { label: "Organization name", value: "Helia Suite Demo" },
      { label: "Region", value: "EU — Frankfurt" },
    ],
  },
  {
    title: "Notifications",
    rows: [
      { label: "Product updates", on: true },
      { label: "Billing alerts", on: true },
      { label: "Weekly digest", on: false },
    ],
  },
];

export default function DashboardSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {SECTIONS.map((section, si) => (
        <motion.section
          key={section.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1, duration: 0.35 }}
          className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm"
        >
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="text-sm font-semibold text-white">
              {section.title}
            </h2>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {section.rows.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
              >
                <span className="text-sm text-white/70">{row.label}</span>
                {"value" in row ? (
                  <span className="text-sm font-medium text-white/90">
                    {row.value}
                  </span>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      "relative h-7 w-12 rounded-full transition-colors",
                      row.on ? "bg-accent/35" : "bg-white/10"
                    )}
                    aria-pressed={row.on}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all",
                        row.on ? "left-6 bg-[#0A0A0B]" : "left-1"
                      )}
                    />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </motion.section>
      ))}
      <p className="px-1 text-center text-xs text-white/35">
        Controls are visual only — connect your backend when you ship.
      </p>
    </div>
  );
}
