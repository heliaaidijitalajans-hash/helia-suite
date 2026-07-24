"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import {
  getActiveOrganizationId,
  getActiveProjectId,
  setActiveProjectId,
} from "@/lib/cloud/active-context";
import { cn } from "@/lib/cn";
import {
  createApiKey,
  deleteApiKey,
  disableApiKey,
  listApiKeys,
  listOrganizations,
  listProjects,
  rotateApiKey,
  type ApiKeyEnvironment,
  type CloudApiKey,
  type CloudProject,
} from "@/services/cloud";
import {
  CloudAlert,
  CloudField,
  CloudPanel,
  cloudBtnDangerClass,
  cloudBtnPrimaryClass,
  cloudBtnSecondaryClass,
  cloudInputClass,
} from "@/components/dashboard/cloud/ui";

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function ApiKeysPage() {
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [keys, setKeys] = useState<CloudApiKey[]>([]);
  const [name, setName] = useState("");
  const [keyEnvironment, setKeyEnvironment] =
    useState<ApiKeyEnvironment>("test");
  const [expiresAt, setExpiresAt] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const refresh = useCallback(async (selectedProject?: string) => {
    setLoading(true);
    setError(null);
    try {
      const orgId = getActiveOrganizationId();
      await listOrganizations();
      const projectItems = orgId
        ? await listProjects(orgId)
        : await listProjects();
      setProjects(projectItems);

      const stored = selectedProject || getActiveProjectId();
      const nextProject =
        (stored && projectItems.some((p) => p.id === stored) && stored) ||
        projectItems[0]?.id ||
        "";
      setProjectId(nextProject);
      if (nextProject) setActiveProjectId(nextProject);

      const items = nextProject
        ? await listApiKeys(nextProject)
        : await listApiKeys();
      setKeys(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleProjectChange(next: string) {
    setProjectId(next);
    setActiveProjectId(next || null);
    setRevealedSecret(null);
    await refresh(next);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !name.trim()) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    setCopied(false);
    try {
      const result = await createApiKey({
        projectId,
        name: name.trim(),
        keyEnvironment,
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
      setName("");
      setExpiresAt("");
      setRevealedSecret(result.secret);
      setInfo(result.warning || "API key created. Copy the secret now.");
      await refresh(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRotate(id: string) {
    if (!window.confirm("Rotate this API key? The previous secret stops working.")) {
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    setCopied(false);
    try {
      const result = await rotateApiKey(id);
      setRevealedSecret(result.secret);
      setInfo(result.warning || "API key rotated. Copy the new secret now.");
      await refresh(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rotate failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable(id: string) {
    setBusy(true);
    setError(null);
    try {
      await disableApiKey(id);
      setInfo("API key disabled.");
      await refresh(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disable failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this API key permanently?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteApiKey(id);
      setInfo("API key deleted.");
      if (revealedSecret) setRevealedSecret(null);
      await refresh(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!revealedSecret) return;
    try {
      await navigator.clipboard.writeText(revealedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  async function copyPrefix(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setInfo(`Copied ${value}`);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {error ? <CloudAlert message={error} /> : null}
      {info ? <CloudAlert message={info} tone="info" /> : null}

      {revealedSecret ? (
        <CloudAlert
          tone="success"
          message={`Secret (shown once): ${revealedSecret}`}
        />
      ) : null}
      {revealedSecret ? (
        <button
          type="button"
          onClick={() => void copySecret()}
          className={cn(cloudBtnPrimaryClass, "inline-flex gap-2")}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy API Key"}
        </button>
      ) : null}

      <CloudPanel
        title="Create API key"
        description="POST /apikeys — secret is returned once at create/rotate."
      >
        <form onSubmit={(e) => void handleCreate(e)} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CloudField label="Project">
              <select
                className={cloudInputClass}
                value={projectId}
                onChange={(e) => void handleProjectChange(e.target.value)}
                required
              >
                {projects.length === 0 ? (
                  <option value="">No projects</option>
                ) : (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.environment})
                    </option>
                  ))
                )}
              </select>
            </CloudField>
            <CloudField label="Name">
              <input
                className={cloudInputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production Key"
                required
              />
            </CloudField>
            <CloudField label="Key environment">
              <select
                className={cloudInputClass}
                value={keyEnvironment}
                onChange={(e) =>
                  setKeyEnvironment(e.target.value as ApiKeyEnvironment)
                }
              >
                <option value="live">live</option>
                <option value="test">test</option>
              </select>
            </CloudField>
            <CloudField label="Expiration (optional)">
              <input
                type="datetime-local"
                className={cloudInputClass}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </CloudField>
          </div>
          <button
            type="submit"
            disabled={busy || !projectId}
            className={cn(cloudBtnPrimaryClass, "w-fit")}
          >
            Create API key
          </button>
        </form>
      </CloudPanel>

      <CloudPanel
        title="API keys"
        description={
          loading
            ? "Loading…"
            : `${keys.length} key${keys.length === 1 ? "" : "s"}`
        }
      >
        {loading ? (
          <p className="text-sm text-white/45">Loading API keys…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-white/45">No API keys for this project.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-medium uppercase tracking-[0.1em] text-white/35">
                  <th className="px-2 py-3 font-medium">Name</th>
                  <th className="px-2 py-3 font-medium">Prefix</th>
                  <th className="px-2 py-3 font-medium">Usage</th>
                  <th className="px-2 py-3 font-medium">Last used</th>
                  <th className="px-2 py-3 font-medium">Expires</th>
                  <th className="px-2 py-3 font-medium">Status</th>
                  <th className="px-2 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key, i) => (
                  <motion.tr
                    key={key.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-2 py-3 text-white/90">
                      <div>{key.name}</div>
                      <div className="text-[11px] text-white/35">
                        {key.keyEnvironment} · …{key.lastFour}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-white/70">
                      <button
                        type="button"
                        className="font-mono text-xs hover:text-accent"
                        onClick={() => void copyPrefix(key.prefix)}
                        title="Copy prefix"
                      >
                        {key.prefix}
                      </button>
                    </td>
                    <td className="px-2 py-3 text-white/70">{key.usageCount}</td>
                    <td className="px-2 py-3 text-white/55">
                      {formatDate(key.lastUsedAt)}
                    </td>
                    <td className="px-2 py-3 text-white/55">
                      {formatDate(key.expiresAt)}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          key.enabled ? "text-emerald-300/90" : "text-white/40"
                        )}
                      >
                        {key.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={cloudBtnSecondaryClass}
                          disabled={busy}
                          onClick={() => void handleRotate(key.id)}
                        >
                          Rotate
                        </button>
                        <button
                          type="button"
                          className={cloudBtnSecondaryClass}
                          disabled={busy || !key.enabled}
                          onClick={() => void handleDisable(key.id)}
                        >
                          Disable
                        </button>
                        <button
                          type="button"
                          className={cloudBtnDangerClass}
                          disabled={busy}
                          onClick={() => void handleDelete(key.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CloudPanel>
    </div>
  );
}
