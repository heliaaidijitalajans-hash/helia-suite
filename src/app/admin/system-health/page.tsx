"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPanel } from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";
import { cn } from "@/lib/cn";

type Health = {
  status: string;
  checkedAt: string;
  uptimeSeconds: number;
  services: Record<string, string>;
  memory: {
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
  };
  cpu: { loadAverage: number[] };
  platformVersion: string;
  nodeEnv: string;
};

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<{ health: Health }>("/api/admin/health");
      setHealth(res.health);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading && !health) {
    return <p className="text-sm text-white/45">Checking system health…</p>;
  }
  if (error && !health) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
        {error}
      </div>
    );
  }
  if (!health) return null;

  return (
    <div className="space-y-6">
      <AdminPanel
        title="System status"
        description={`Checked ${new Date(health.checkedAt).toLocaleString()} · ${health.nodeEnv} · v${health.platformVersion}`}
      >
        <p
          className={cn(
            "mb-6 inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide",
            health.status === "healthy"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100/90"
              : "border-amber-500/30 bg-amber-500/10 text-amber-100/90"
          )}
        >
          {health.status}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(health.services).map(([name, state]) => (
            <div
              key={name}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
            >
              <p className="text-xs uppercase tracking-wide text-white/40">
                {name}
              </p>
              <p
                className={cn(
                  "mt-2 text-sm font-medium capitalize",
                  state === "ok" ? "text-emerald-200/90" : "text-red-200/90"
                )}
              >
                {state}
              </p>
            </div>
          ))}
        </div>
      </AdminPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel title="Memory">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/45">RSS</dt>
              <dd>{fmtBytes(health.memory.rssBytes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/45">Heap used</dt>
              <dd>{fmtBytes(health.memory.heapUsedBytes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/45">Heap total</dt>
              <dd>{fmtBytes(health.memory.heapTotalBytes)}</dd>
            </div>
          </dl>
        </AdminPanel>
        <AdminPanel title="Runtime">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/45">Uptime</dt>
              <dd>{Math.floor(health.uptimeSeconds / 60)} min</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/45">Load average</dt>
              <dd>
                {health.cpu.loadAverage.length
                  ? health.cpu.loadAverage.map((n) => n.toFixed(2)).join(" / ")
                  : "n/a on this host"}
              </dd>
            </div>
          </dl>
        </AdminPanel>
      </div>
    </div>
  );
}
