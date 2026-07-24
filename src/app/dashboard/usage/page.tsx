"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Gauge,
  Radio,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  getActiveOrganizationId,
  setActiveOrganizationId,
} from "@/lib/cloud/active-context";
import {
  fetchUsage,
  listOrganizations,
  listPlans,
  type CloudOrganization,
  type CloudPlan,
  type CloudUsageResponse,
} from "@/services/cloud";
import {
  CloudAlert,
  CloudField,
  CloudPanel,
  cloudInputClass,
} from "@/components/dashboard/cloud/ui";

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export default function UsagePage() {
  const [orgs, setOrgs] = useState<CloudOrganization[]>([]);
  const [plans, setPlans] = useState<CloudPlan[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [usage, setUsage] = useState<CloudUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (orgId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [organizations, planItems] = await Promise.all([
        listOrganizations(),
        listPlans(),
      ]);
      setOrgs(organizations);
      setPlans(planItems);

      const stored = orgId || getActiveOrganizationId();
      const nextOrg =
        (stored && organizations.some((o) => o.id === stored) && stored) ||
        organizations[0]?.id ||
        "";
      setOrganizationId(nextOrg);
      if (nextOrg) setActiveOrganizationId(nextOrg);

      const data = await fetchUsage(nextOrg || null);
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load usage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totals = useMemo(() => {
    if (usage?.totals) return usage.totals;
    const buckets = usage?.buckets ?? [];
    return buckets.reduce(
      (acc, b) => ({
        requests: acc.requests + b.requests,
        errors: acc.errors + b.errors,
        brainRequests: acc.brainRequests + b.brainRequests,
        monitoringRequests: acc.monitoringRequests + b.monitoringRequests,
        storageBytes: acc.storageBytes + b.storageBytes,
        bandwidthBytes: acc.bandwidthBytes + b.bandwidthBytes,
      }),
      {
        requests: 0,
        errors: 0,
        brainRequests: 0,
        monitoringRequests: 0,
        storageBytes: 0,
        bandwidthBytes: 0,
      }
    );
  }, [usage]);

  const currentPlan = useMemo(() => {
    const fromSub = usage?.subscription?.planId;
    const fromOrg = orgs.find((o) => o.id === organizationId)?.planId;
    const planId = fromSub || fromOrg;
    return plans.find((p) => p.id === planId) || null;
  }, [usage, orgs, organizationId, plans]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {error ? <CloudAlert message={error} /> : null}

      <CloudPanel
        title="Usage scope"
        description="GET /usage — monthly buckets from Helia Cloud."
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <CloudField label="Organization">
            <select
              className={cloudInputClass}
              value={organizationId}
              onChange={(e) => {
                const next = e.target.value;
                setOrganizationId(next);
                setActiveOrganizationId(next || null);
                void refresh(next);
              }}
            >
              {orgs.length === 0 ? (
                <option value="">No organizations</option>
              ) : (
                orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))
              )}
            </select>
          </CloudField>
          <p className="text-xs text-white/40 md:pb-3">
            Month: {loading ? "…" : usage?.month || "—"}
          </p>
        </div>
      </CloudPanel>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total Requests"
          value={loading ? "—" : formatNumber(totals.requests)}
          hint="All gateway requests"
          icon={Activity}
          delay={0}
        />
        <KpiCard
          label="Brain Requests"
          value={loading ? "—" : formatNumber(totals.brainRequests)}
          hint="Helia Brain usage"
          icon={Brain}
          delay={0.04}
        />
        <KpiCard
          label="Monitoring Requests"
          value={loading ? "—" : formatNumber(totals.monitoringRequests)}
          hint="Monitoring ingest"
          icon={Radio}
          delay={0.08}
        />
        <KpiCard
          label="Errors"
          value={loading ? "—" : formatNumber(totals.errors)}
          hint="Tracked error metric"
          icon={AlertTriangle}
          delay={0.12}
        />
        <KpiCard
          label="Monthly Usage"
          value={
            loading
              ? "—"
              : `${formatNumber(totals.requests + totals.brainRequests + totals.monitoringRequests)}`
          }
          hint={usage?.month ? `Period ${usage.month}` : "Current month"}
          icon={Gauge}
          delay={0.16}
        />
        <KpiCard
          label="Current Plan"
          value={loading ? "—" : currentPlan?.name || usage?.subscription?.planId || "—"}
          hint={
            currentPlan
              ? `${formatNumber(currentPlan.limits.monthlyRequests ?? 0)} req / mo`
              : usage?.subscription?.status || "From Helia Cloud"
          }
          icon={Gauge}
          delay={0.2}
        />
      </div>

      <CloudPanel
        title="Project buckets"
        description="Per-project usage for the selected organization and month."
      >
        {loading ? (
          <p className="text-sm text-white/45">Loading usage…</p>
        ) : !usage?.buckets?.length ? (
          <p className="text-sm text-white/45">No usage recorded this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-medium uppercase tracking-[0.1em] text-white/35">
                  <th className="px-2 py-3 font-medium">Project</th>
                  <th className="px-2 py-3 font-medium">Requests</th>
                  <th className="px-2 py-3 font-medium">Brain</th>
                  <th className="px-2 py-3 font-medium">Monitoring</th>
                  <th className="px-2 py-3 font-medium">Errors</th>
                  <th className="px-2 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {usage.buckets.map((bucket) => (
                  <tr
                    key={bucket.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-2 py-3 font-mono text-xs text-white/70">
                      {bucket.projectId}
                    </td>
                    <td className="px-2 py-3 text-white/80">
                      {formatNumber(bucket.requests)}
                    </td>
                    <td className="px-2 py-3 text-white/80">
                      {formatNumber(bucket.brainRequests)}
                    </td>
                    <td className="px-2 py-3 text-white/80">
                      {formatNumber(bucket.monitoringRequests)}
                    </td>
                    <td className="px-2 py-3 text-white/80">
                      {formatNumber(bucket.errors)}
                    </td>
                    <td className="px-2 py-3 text-xs text-white/45">
                      {new Date(bucket.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CloudPanel>
    </div>
  );
}
