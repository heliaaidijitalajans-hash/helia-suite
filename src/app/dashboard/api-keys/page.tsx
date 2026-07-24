"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { setActiveProjectId } from "@/lib/cloud/active-context";
import { cn } from "@/lib/cn";
import {
  API_CAPABILITIES,
  API_CAPABILITY_LABELS,
  API_PERMISSIONS,
  API_PERMISSION_LABELS,
  APPLICATION_TYPE_LABELS,
  APPLICATION_TYPE_OPTIONS,
  isApplicationType,
  isInternalPlatform,
  toApplicationTypeEnum,
  type ApiCapability,
  type ApiPermission,
  type ApplicationType,
} from "@/lib/api-keys";
import {
  createApiKey,
  deleteApiKey,
  disableApiKey,
  ensureWorkspace,
  listApiKeys,
  rotateApiKey,
  type ApiKeyEnvironment,
  type CloudApiKey,
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

function summarizeList(items: string[] | undefined, limit = 3): string {
  if (!items?.length) return "—";
  if (items.length <= limit) return items.join(", ");
  return `${items.slice(0, limit).join(", ")} +${items.length - limit}`;
}

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export default function ApiKeysPage() {
  const [projectId, setProjectId] = useState("");
  const [projectLabel, setProjectLabel] = useState("");
  const [keys, setKeys] = useState<CloudApiKey[]>([]);
  const [name, setName] = useState("");
  const [keyEnvironment, setKeyEnvironment] =
    useState<ApiKeyEnvironment>("test");
  const [applicationType, setApplicationType] =
    useState<ApplicationType>("backend");
  const [capabilities, setCapabilities] = useState<ApiCapability[]>([
    "monitoring",
    "health",
  ]);
  const [permissions, setPermissions] = useState<ApiPermission[]>(["read"]);
  const [expiresAt, setExpiresAt] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const internal = isInternalPlatform(applicationType);
  const effectiveCapabilities = useMemo(
    () => (internal ? [...API_CAPABILITIES] : capabilities),
    [internal, capabilities]
  );
  const effectivePermissions = useMemo(
    () => (internal ? [...API_PERMISSIONS] : permissions),
    [internal, permissions]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { project } = await ensureWorkspace();
      setProjectId(project.id);
      setProjectLabel(`${project.name} (${project.environment})`);
      setActiveProjectId(project.id);
      const items = await listApiKeys(project.id);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!internal && effectiveCapabilities.length === 0) {
      setError("Select at least one capability.");
      return;
    }
    if (!internal && effectivePermissions.length === 0) {
      setError("Select at least one permission.");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    setCopied(false);
    try {
      const { project } = await ensureWorkspace();
      setProjectId(project.id);
      setProjectLabel(`${project.name} (${project.environment})`);
      setActiveProjectId(project.id);

      const result = await createApiKey({
        projectId: project.id,
        name: name.trim(),
        keyEnvironment,
        applicationType: toApplicationTypeEnum(applicationType),
        capabilities: effectiveCapabilities,
        permissions: effectivePermissions,
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
      setName("");
      setExpiresAt("");
      setRevealedSecret(result.secret);
      setInfo(
        result.warning ||
          (internal
            ? "Internal Platform key created with full capabilities."
            : "API key created. Copy the secret now.")
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRotate(id: string) {
    if (
      !window.confirm(
        "Rotate this API key? The previous secret stops working."
      )
    ) {
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
      await refresh();
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
      await refresh();
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
      await refresh();
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
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy API Key"}
        </button>
      ) : null}

      <CloudPanel
        title="Create API key"
        description="Create a capability-aware key for your workspace. Manage projects separately under Projects."
      >
        <form onSubmit={(e) => void handleCreate(e)} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CloudField label="Workspace project">
              <input
                className={cloudInputClass}
                value={loading ? "Loading…" : projectLabel || "Default"}
                readOnly
                aria-readonly
              />
            </CloudField>
            <CloudField label="Key name">
              <input
                className={cloudInputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production key"
                required
              />
            </CloudField>
            <CloudField label="Environment">
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
            <CloudField label="Application type">
              <select
                className={cloudInputClass}
                value={applicationType}
                onChange={(e) => {
                  const next = e.target.value;
                  if (isApplicationType(next)) setApplicationType(next);
                }}
              >
                {APPLICATION_TYPE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.08] bg-[#121214]/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                Permissions
              </p>
              {internal ? (
                <p className="mt-2 text-xs text-accent/90">
                  Internal Platform enables Read, Write, Execute, and Admin.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {API_PERMISSIONS.map((permission) => {
                  const checked = effectivePermissions.includes(permission);
                  return (
                    <label
                      key={permission}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                        checked
                          ? "border-accent/40 bg-accent/10 text-white"
                          : "border-white/10 text-white/55 hover:border-white/20",
                        internal && "pointer-events-none opacity-80"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        disabled={internal}
                        onChange={() =>
                          setPermissions((prev) =>
                            toggleValue(prev, permission)
                          )
                        }
                      />
                      {API_PERMISSION_LABELS[permission]}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#121214]/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                Capabilities
              </p>
              {internal ? (
                <p className="mt-2 text-xs text-accent/90">
                  All capabilities enabled automatically for Internal Platform.
                </p>
              ) : (
                <p className="mt-2 text-xs text-white/40">
                  Select the surfaces this key may access.
                </p>
              )}
              <div className="mt-3 max-h-48 overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-2">
                  {API_CAPABILITIES.map((capability) => {
                    const checked =
                      effectiveCapabilities.includes(capability);
                    return (
                      <label
                        key={capability}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                          checked
                            ? "border-accent/40 bg-accent/10 text-white"
                            : "border-white/10 text-white/55 hover:border-white/20",
                          internal && "pointer-events-none opacity-80"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          disabled={internal}
                          onChange={() =>
                            setCapabilities((prev) =>
                              toggleValue(prev, capability)
                            )
                          }
                        />
                        {API_CAPABILITY_LABELS[capability]}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
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
          <p className="text-sm text-white/45">No API Keys yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-medium uppercase tracking-[0.1em] text-white/35">
                  <th className="px-2 py-3 font-medium">Name</th>
                  <th className="px-2 py-3 font-medium">App</th>
                  <th className="px-2 py-3 font-medium">Capabilities</th>
                  <th className="px-2 py-3 font-medium">Permissions</th>
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
                      <button
                        type="button"
                        className="mt-0.5 font-mono text-[11px] text-white/35 hover:text-accent"
                        onClick={() => void copyPrefix(key.prefix)}
                        title="Copy prefix"
                      >
                        {key.prefix} · {key.keyEnvironment}
                      </button>
                    </td>
                    <td className="px-2 py-3 text-xs text-white/65">
                      {key.applicationType
                        ? APPLICATION_TYPE_LABELS[
                            key.applicationType as ApplicationType
                          ] ?? key.applicationType
                        : "—"}
                    </td>
                    <td
                      className="max-w-[14rem] px-2 py-3 text-xs text-white/55"
                      title={(key.capabilities ?? [])
                        .map(
                          (c) =>
                            API_CAPABILITY_LABELS[c as ApiCapability] ?? c
                        )
                        .join(", ")}
                    >
                      {summarizeList(
                        (key.capabilities ?? []).map(
                          (c) =>
                            API_CAPABILITY_LABELS[c as ApiCapability] ?? c
                        ),
                        2
                      )}
                    </td>
                    <td className="px-2 py-3 text-xs text-white/65">
                      {summarizeList(
                        (key.permissions ?? []).map(
                          (p) => API_PERMISSION_LABELS[p as ApiPermission] ?? p
                        ),
                        4
                      )}
                    </td>
                    <td className="px-2 py-3 text-white/70">
                      {key.usageCount}
                    </td>
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
                          key.enabled
                            ? "text-emerald-300/90"
                            : "text-white/40"
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
