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

type AppRow = {
  id: string;
  name: string;
  status: string;
  organizationName: string;
  apiKeyPrefix: string;
  applicationType: string | null;
  lastActivity: string | null;
  requests: number;
  createdAt: string;
};

export default function AdminApplicationsPage() {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q,
        ...(status !== "all" ? { status } : {}),
      });
      const res = await adminFetch<{ applications: AppRow[] }>(
        `/api/admin/applications?${params}`
      );
      setRows(res.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load apps");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setEnabled(id: string, enabled: boolean) {
    setBusyId(id);
    setError(null);
    try {
      await adminFetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function rotate(id: string) {
    if (!window.confirm("Rotate API key? The previous key will be disabled."))
      return;
    setBusyId(id);
    setError(null);
    setInfo(null);
    try {
      const res = await adminFetch<{ secret: string }>(
        `/api/admin/applications/${id}/rotate`,
        { method: "POST" }
      );
      setInfo(`New secret (copy now): ${res.secret}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rotate failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this application API key?")) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/admin/applications/${id}`, { method: "DELETE" });
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
        title="Applications"
        description="Every application connected to Helia API — equal treatment for all."
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              className={cn(adminInputClass, "sm:w-56")}
              placeholder="Search applications"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className={adminInputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        }
      >
        {error ? <p className="mb-4 text-sm text-red-100/90">{error}</p> : null}
        {info ? (
          <p className="mb-4 break-all rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-accent">
            {info}
          </p>
        ) : null}
        {loading ? (
          <p className="text-sm text-white/45">Loading applications…</p>
        ) : rows.length === 0 ? (
          <AdminEmpty
            title="No applications connected"
            description="Applications appear when customers create API keys (e.g. SnapSell, website, CRM)."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/40">
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Organization</th>
                  <th className="pb-3 pr-4 font-medium">API Key</th>
                  <th className="pb-3 pr-4 font-medium">Last activity</th>
                  <th className="pb-3 pr-4 font-medium">Requests</th>
                  <th className="pb-3 pr-4 font-medium">Created</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-white/[0.04]">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{a.name}</p>
                      <p className="text-xs text-white/40">
                        {a.applicationType ?? "—"}
                      </p>
                    </td>
                    <td className="py-3 pr-4 capitalize">{a.status}</td>
                    <td className="py-3 pr-4">{a.organizationName}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-white/60">
                      {a.apiKeyPrefix}
                    </td>
                    <td className="py-3 pr-4 text-xs text-white/45">
                      {a.lastActivity
                        ? new Date(a.lastActivity).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">{a.requests}</td>
                    <td className="py-3 pr-4 text-xs text-white/45">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={adminBtnSecondary}
                          disabled={busyId === a.id}
                          onClick={() =>
                            void setEnabled(a.id, a.status !== "enabled")
                          }
                        >
                          {a.status === "enabled" ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className={adminBtnSecondary}
                          disabled={busyId === a.id}
                          onClick={() => void rotate(a.id)}
                        >
                          Rotate key
                        </button>
                        <button
                          type="button"
                          className={adminBtnDanger}
                          disabled={busyId === a.id}
                          onClick={() => void remove(a.id)}
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
    </div>
  );
}
