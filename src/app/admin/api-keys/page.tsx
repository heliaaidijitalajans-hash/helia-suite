"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminEmpty,
  AdminPanel,
  adminBtnDanger,
  adminBtnPrimary,
  adminBtnSecondary,
  adminInputClass,
} from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";
import { cn } from "@/lib/cn";

type KeyRow = {
  id: string;
  name: string;
  status: string;
  organizationName: string;
  apiKeyPrefix: string;
  ownerEmail: string | null;
  applicationType: string | null;
  permissions: string[];
  capabilities: string[];
  requests: number;
  lastActivity: string | null;
  createdAt: string;
};

export default function AdminApiKeysPage() {
  const [rows, setRows] = useState<KeyRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("Admin Test Key");
  const [keyEnvironment, setKeyEnvironment] = useState<"test" | "live">(
    "test"
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q,
        ...(status !== "all" ? { status } : {}),
      });
      const res = await adminFetch<{ apiKeys: KeyRow[] }>(
        `/api/admin/apikeys?${params}`
      );
      setRows(res.apiKeys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createKey() {
    setCreating(true);
    setError(null);
    setInfo(null);
    try {
      const res = await adminFetch<{
        secret: string;
        apiKey: { id: string; prefix: string; keyEnvironment?: string };
      }>("/api/admin/apikeys", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim() || "Admin Test Key",
          keyEnvironment,
          applicationType: "backend",
        }),
      });
      setInfo(
        `Created ${res.apiKey.prefix}… — copy secret now: ${res.secret}`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function setEnabled(id: string, enabled: boolean) {
    setBusyId(id);
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
    if (!window.confirm("Rotate this API key?")) return;
    setBusyId(id);
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
    if (!window.confirm("Delete this API key?")) return;
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
        title="Create API key"
        description="Creates a hashed API key in the durable Helia Cloud store. Copy the secret once — it is never stored in plaintext."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
              Name
            </span>
            <input
              className={adminInputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Admin Test Key"
            />
          </label>
          <label className="block space-y-1.5 sm:w-40">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
              Environment
            </span>
            <select
              className={adminInputClass}
              value={keyEnvironment}
              onChange={(e) =>
                setKeyEnvironment(e.target.value as "test" | "live")
              }
            >
              <option value="test">hl_test_</option>
              <option value="live">hl_live_</option>
            </select>
          </label>
          <button
            type="button"
            className={adminBtnPrimary}
            disabled={creating || !name.trim()}
            onClick={() => void createKey()}
          >
            {creating ? "Creating…" : "Create key"}
          </button>
        </div>
      </AdminPanel>

      <AdminPanel
        title="API Keys"
        description="Global key management — usage, capabilities, owners, and applications."
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              className={cn(adminInputClass, "sm:w-56")}
              placeholder="Search keys"
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
          <p className="text-sm text-white/45">Loading API keys…</p>
        ) : rows.length === 0 ? (
          <AdminEmpty
            title="No API keys"
            description="Create a key above — it is written into the runtime API key store immediately."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/40">
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 pr-4 font-medium">Key / App</th>
                  <th className="pb-3 pr-4 font-medium">Owner</th>
                  <th className="pb-3 pr-4 font-medium">Organization</th>
                  <th className="pb-3 pr-4 font-medium">Permissions</th>
                  <th className="pb-3 pr-4 font-medium">Capabilities</th>
                  <th className="pb-3 pr-4 font-medium">Usage</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => (
                  <tr
                    key={k.id}
                    className="border-b border-white/[0.04] align-top"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{k.name}</p>
                      <p className="font-mono text-xs text-white/45">
                        {k.apiKeyPrefix}
                      </p>
                      <p className="mt-1 text-[11px] text-white/35">
                        {k.status} · {k.applicationType ?? "n/a"}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-white/65">
                      {k.ownerEmail ?? "—"}
                    </td>
                    <td className="py-3 pr-4">{k.organizationName}</td>
                    <td className="py-3 pr-4 text-xs text-white/55">
                      {(k.permissions ?? []).join(", ") || "—"}
                    </td>
                    <td className="py-3 pr-4 text-xs text-white/55">
                      {(k.capabilities ?? []).slice(0, 4).join(", ") || "—"}
                      {(k.capabilities ?? []).length > 4 ? "…" : ""}
                    </td>
                    <td className="py-3 pr-4 text-xs text-white/55">
                      {k.requests} hits
                      <br />
                      {k.lastActivity
                        ? new Date(k.lastActivity).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={adminBtnSecondary}
                          disabled={busyId === k.id}
                          onClick={() =>
                            void setEnabled(k.id, k.status !== "enabled")
                          }
                        >
                          {k.status === "enabled" ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className={adminBtnSecondary}
                          disabled={busyId === k.id}
                          onClick={() => void rotate(k.id)}
                        >
                          Rotate
                        </button>
                        <button
                          type="button"
                          className={adminBtnDanger}
                          disabled={busyId === k.id}
                          onClick={() => void remove(k.id)}
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
