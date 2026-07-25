"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, KeyRound, Users } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AdminEmpty, AdminPanel } from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";

type Analytics = {
  users: number;
  apiKeys: number;
  activeApiKeys: number;
  requestsToday: number;
  monthRequests: number;
  monthErrors: number;
  errorRate: number;
  authEvents: number;
  errorLogs: number;
  series: Array<{
    month: string;
    requests: number;
    errors: number;
    brainRequests: number;
  }>;
  topKeys: Array<{
    id: string;
    name: string;
    usageCount: number;
    lastUsedAt: string | null;
  }>;
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<{ analytics: Analytics }>(
        "/api/admin/analytics"
      );
      setData(res.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-white/45">Loading analytics…</p>;
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const maxReq = Math.max(1, ...data.series.map((s) => s.requests));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Users" value={String(data.users)} icon={Users} />
        <KpiCard
          label="Active API keys"
          value={String(data.activeApiKeys)}
          hint={`${data.apiKeys} total`}
          icon={KeyRound}
          delay={0.05}
        />
        <KpiCard
          label="Requests today"
          value={String(data.requestsToday)}
          hint={`${data.monthRequests} this month`}
          icon={Activity}
          delay={0.1}
        />
        <KpiCard
          label="Error rate"
          value={`${data.errorRate}%`}
          hint={`${data.monthErrors} month errors`}
          icon={AlertTriangle}
          delay={0.15}
        />
      </div>

      <AdminPanel
        title="Traffic by month"
        description="Real usage buckets only — no synthetic charts."
      >
        {data.series.length === 0 ? (
          <AdminEmpty
            title="No usage data"
            description="Monthly traffic series fills as API requests are recorded."
          />
        ) : (
          <ul className="space-y-3">
            {data.series.map((s) => (
              <li key={s.month}>
                <div className="mb-1 flex justify-between text-xs text-white/45">
                  <span>{s.month}</span>
                  <span>
                    {s.requests} req · {s.errors} err · {s.brainRequests} brain
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-accent/80"
                    style={{
                      width: `${Math.max(4, (s.requests / maxReq) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel title="Top API keys by usage">
        {data.topKeys.length === 0 ? (
          <AdminEmpty
            title="No key usage yet"
            description="Keys with recorded hits will rank here."
          />
        ) : (
          <ul className="space-y-2 text-sm">
            {data.topKeys.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between border-b border-white/[0.05] py-2"
              >
                <span className="text-white/85">{k.name}</span>
                <span className="text-xs text-white/45">
                  {k.usageCount} ·{" "}
                  {k.lastUsedAt
                    ? new Date(k.lastUsedAt).toLocaleString()
                    : "never"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
