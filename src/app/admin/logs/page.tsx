"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminEmpty,
  AdminPanel,
  adminInputClass,
} from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";
import { cn } from "@/lib/cn";

type LogRow = {
  id: string;
  level: string;
  category: string;
  message: string;
  createdAt: string;
  organizationId?: string;
  apiKeyId?: string;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [category, setCategory] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q, level, category });
      const res = await adminFetch<{ logs: LogRow[] }>(
        `/api/admin/logs?${params}`
      );
      setLogs(res.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [q, level, category]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPanel
      title="Logs"
      description="Authentication, API, application, and admin events from the real audit store."
      actions={
        <div className="flex flex-wrap gap-2">
          <input
            className={cn(adminInputClass, "sm:w-56")}
            placeholder="Search logs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className={adminInputClass}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="all">All levels</option>
            <option value="info">Info</option>
            <option value="warning">Warnings</option>
            <option value="error">Errors</option>
          </select>
          <select
            className={adminInputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            <option value="auth">Authentication</option>
            <option value="request">Requests</option>
            <option value="api">API</option>
            <option value="application">Applications</option>
            <option value="admin">Admin</option>
            <option value="system">System</option>
          </select>
        </div>
      }
    >
      {error ? <p className="mb-4 text-sm text-red-100/90">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-white/45">Loading logs…</p>
      ) : logs.length === 0 ? (
        <AdminEmpty
          title="No logs yet"
          description="Logs appear when admins act or API keys are used through the gateway."
        />
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide">
                  <span
                    className={
                      log.level === "error"
                        ? "text-red-200/90"
                        : log.level === "warning"
                          ? "text-amber-200/90"
                          : "text-white/45"
                    }
                  >
                    {log.level}
                  </span>
                  <span className="text-white/35">{log.category}</span>
                </div>
                <time className="text-xs text-white/40">
                  {new Date(log.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-2 text-sm text-white/85">{log.message}</p>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}
