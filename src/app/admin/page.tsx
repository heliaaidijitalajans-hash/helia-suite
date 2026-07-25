"use client";

import { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  Building2,
  FolderKanban,
  Users,
  Activity,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AdminEmpty, AdminPanel } from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";

type Overview = {
  totals: {
    users: number;
    organizations: number;
    projects: number;
    activeApiKeys: number;
    apiKeys: number;
  };
  requestsToday: number;
  monthRequests: number;
  monthErrors: number;
  errorRate: number;
  uptimeSeconds: number;
  latestActivity: Array<{ at: string; type: string; summary: string }>;
  recentDeployments: Array<{ id: string; label: string; at: string }>;
  platformVersion: string;
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<{ overview: Overview }>("/api/admin/overview");
      setData(res.overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-white/45">Loading admin overview…</p>;
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
        {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent/80">
          Platform
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Operations overview
        </h2>
        <p className="mt-2 text-sm text-white/45">
          Live totals from Helia Cloud. Version {data.platformVersion}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Users" value={String(data.totals.users)} icon={Users} />
        <KpiCard
          label="Organizations"
          value={String(data.totals.organizations)}
          icon={Building2}
          delay={0.04}
        />
        <KpiCard
          label="Projects"
          value={String(data.totals.projects)}
          icon={FolderKanban}
          delay={0.08}
        />
        <KpiCard
          label="Active API Keys"
          value={String(data.totals.activeApiKeys)}
          hint={`${data.totals.apiKeys} total`}
          icon={KeyRound}
          delay={0.12}
        />
        <KpiCard
          label="Requests today"
          value={String(data.requestsToday)}
          hint={`${data.monthRequests} this month`}
          icon={Activity}
          delay={0.16}
        />
        <KpiCard
          label="Error rate"
          value={`${data.errorRate}%`}
          hint={`${data.monthErrors} errors this month`}
          icon={AlertTriangle}
          delay={0.2}
        />
        <KpiCard
          label="Uptime"
          value={formatUptime(data.uptimeSeconds)}
          icon={Timer}
          delay={0.24}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel
          title="Latest activity"
          description="Derived from logins, API key usage, and audit events."
        >
          {data.latestActivity.length === 0 ? (
            <AdminEmpty
              title="No activity yet"
              description="Activity appears when users sign in or API keys are used."
            />
          ) : (
            <ul className="space-y-3">
              {data.latestActivity.map((item, i) => (
                <li
                  key={`${item.at}-${i}`}
                  className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm text-white/85">{item.summary}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-white/35">
                      {item.type}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-white/40">
                    {new Date(item.at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel
          title="Recent deployments"
          description="Deployment history when a release pipeline is connected."
        >
          {data.recentDeployments.length === 0 ? (
            <AdminEmpty
              title="No deployments recorded"
              description="Connect a deployment source later. Nothing is invented here."
            />
          ) : (
            <ul className="space-y-3">
              {data.recentDeployments.map((d) => (
                <li key={d.id} className="text-sm text-white/80">
                  {d.label}{" "}
                  <span className="text-white/40">
                    · {new Date(d.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
