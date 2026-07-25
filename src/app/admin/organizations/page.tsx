"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminEmpty,
  AdminPanel,
  adminBtnDanger,
  adminBtnSecondary,
  adminInputClass,
} from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";
import { cn } from "@/lib/cn";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  planId: string;
  status: string;
  projectCount: number;
  apiKeyCount: number;
  memberCount: number;
  usage: { month: string; requests: number; errors: number };
  createdAt: string;
};

export default function AdminOrganizationsPage() {
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<OrgRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q,
        ...(status !== "all" ? { status } : {}),
      });
      const res = await adminFetch<{ organizations: OrgRow[] }>(
        `/api/admin/organizations?${params}`
      );
      setRows(res.organizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orgs");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchOrg(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await adminFetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteOrg(id: string) {
    if (!window.confirm("Delete organization and related projects/keys?")) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/admin/organizations/${id}`, { method: "DELETE" });
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Organizations"
        description="View, edit plan, suspend, or delete customer organizations."
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              className={cn(adminInputClass, "sm:w-56")}
              placeholder="Search organizations"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className={adminInputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        }
      >
        {error ? <p className="mb-4 text-sm text-red-100/90">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-white/45">Loading organizations…</p>
        ) : rows.length === 0 ? (
          <AdminEmpty
            title="No organizations"
            description="Organizations created by customers appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/40">
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 pr-4 font-medium">Organization</th>
                  <th className="pb-3 pr-4 font-medium">Plan</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Projects</th>
                  <th className="pb-3 pr-4 font-medium">API Keys</th>
                  <th className="pb-3 pr-4 font-medium">Usage</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-white/[0.04]">
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        className="text-left font-medium text-white hover:text-accent"
                        onClick={() => setSelected(o)}
                      >
                        {o.name}
                      </button>
                      <p className="text-xs text-white/40">{o.slug}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        className={cn(adminInputClass, "max-w-[9rem]")}
                        value={o.planId}
                        disabled={busyId === o.id}
                        onChange={(e) =>
                          void patchOrg(o.id, { planId: e.target.value })
                        }
                      >
                        {[
                          "free",
                          "starter",
                          "professional",
                          "business",
                          "enterprise",
                        ].map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4 capitalize text-white/75">
                      {o.status}
                    </td>
                    <td className="py-3 pr-4">{o.projectCount}</td>
                    <td className="py-3 pr-4">{o.apiKeyCount}</td>
                    <td className="py-3 pr-4 text-xs text-white/55">
                      {o.usage.requests} req · {o.usage.errors} err
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={adminBtnSecondary}
                          disabled={busyId === o.id}
                          onClick={() =>
                            void patchOrg(o.id, {
                              status:
                                o.status === "suspended"
                                  ? "active"
                                  : "suspended",
                            })
                          }
                        >
                          {o.status === "suspended" ? "Unsuspend" : "Suspend"}
                        </button>
                        <button
                          type="button"
                          className={adminBtnDanger}
                          disabled={busyId === o.id}
                          onClick={() => void deleteOrg(o.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      {selected ? (
        <AdminPanel
          title={selected.name}
          description="Organization detail — projects and API keys from live data."
          actions={
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          }
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/35">
                Members
              </dt>
              <dd className="mt-1 text-white/85">{selected.memberCount}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/35">
                Created
              </dt>
              <dd className="mt-1 text-white/85">
                {new Date(selected.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/35">
                Month usage
              </dt>
              <dd className="mt-1 text-white/85">
                {selected.usage.month}: {selected.usage.requests} requests,{" "}
                {selected.usage.errors} errors
              </dd>
            </div>
          </dl>
        </AdminPanel>
      ) : null}
    </div>
  );
}
