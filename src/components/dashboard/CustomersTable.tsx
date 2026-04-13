"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const ROWS = [
  {
    name: "Summit Logistics",
    company: "Summit Group",
    status: "Active",
    plan: "Full stack",
    last: "2h ago",
  },
  {
    name: "Harbor Retail",
    company: "Harbor Co.",
    status: "Active",
    plan: "Growth",
    last: "5h ago",
  },
  {
    name: "Clearway Health",
    company: "Clearway Ltd",
    status: "Trial",
    plan: "Pilot",
    last: "1d ago",
  },
  {
    name: "Studio Lane",
    company: "Lane Inc",
    status: "Active",
    plan: "Enterprise",
    last: "3h ago",
  },
  {
    name: "Signal Labs",
    company: "Signal SAS",
    status: "Paused",
    plan: "Growth",
    last: "4d ago",
  },
  {
    name: "Bright Foods",
    company: "Bright AG",
    status: "Active",
    plan: "Full stack",
    last: "8h ago",
  },
];

export function CustomersTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm"
    >
      <div className="border-b border-white/[0.06] px-6 py-5">
        <h2 className="text-sm font-semibold text-white">Accounts</h2>
        <p className="mt-1 text-xs text-white/45">
          {ROWS.length} organizations · sample dataset
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs font-medium uppercase tracking-[0.1em] text-white/35">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Company</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <motion.tr
                key={row.name}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.3 }}
                className="group border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-6 py-4 font-medium text-white/95">
                  {row.name}
                </td>
                <td className="px-6 py-4 text-white/55">{row.company}</td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                      row.status === "Active" &&
                        "bg-emerald-500/10 text-emerald-400/95 ring-emerald-500/25",
                      row.status === "Trial" &&
                        "bg-accent/10 text-accent ring-accent/25",
                      row.status === "Paused" &&
                        "bg-white/[0.06] text-white/50 ring-white/10"
                    )}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-white/80">
                  {row.plan}
                </td>
                <td className="px-6 py-4 text-white/40">{row.last}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
