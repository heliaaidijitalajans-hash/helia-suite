"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminPanel,
  adminBtnPrimary,
  adminInputClass,
} from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";

type Settings = {
  systemName: string;
  supportEmail: string;
  jwtAccessTtlSeconds: number;
  rateLimitMax: number;
  requireEmailVerification: boolean;
  brandingAccent: string;
  monthlyRequestSoftLimit: number;
  updatedAt: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<{ settings: Settings }>(
        "/api/admin/settings"
      );
      setSettings(res.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const res = await adminFetch<{ settings: Settings }>(
        "/api/admin/settings",
        {
          method: "PATCH",
          body: JSON.stringify({
            systemName: settings.systemName,
            supportEmail: settings.supportEmail,
            jwtAccessTtlSeconds: settings.jwtAccessTtlSeconds,
            rateLimitMax: settings.rateLimitMax,
            requireEmailVerification: settings.requireEmailVerification,
            brandingAccent: settings.brandingAccent,
            monthlyRequestSoftLimit: settings.monthlyRequestSoftLimit,
          }),
        }
      );
      setSettings(res.settings);
      setInfo("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-white/45">Loading settings…</p>;
  if (!settings) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
        {error ?? "Settings unavailable"}
      </div>
    );
  }

  return (
    <AdminPanel
      title="Admin settings"
      description="System, security, API, JWT, email, branding, and soft limits."
    >
      {error ? <p className="mb-4 text-sm text-red-100/90">{error}</p> : null}
      {info ? <p className="mb-4 text-sm text-emerald-100/90">{info}</p> : null}
      <form onSubmit={(e) => void save(e)} className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-white/40">
            System name
          </span>
          <input
            className={adminInputClass}
            value={settings.systemName}
            onChange={(e) =>
              setSettings({ ...settings, systemName: e.target.value })
            }
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-white/40">
            Support email
          </span>
          <input
            className={adminInputClass}
            type="email"
            value={settings.supportEmail}
            onChange={(e) =>
              setSettings({ ...settings, supportEmail: e.target.value })
            }
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-white/40">
            JWT access TTL (seconds)
          </span>
          <input
            className={adminInputClass}
            type="number"
            min={60}
            value={settings.jwtAccessTtlSeconds}
            onChange={(e) =>
              setSettings({
                ...settings,
                jwtAccessTtlSeconds: Number(e.target.value) || 900,
              })
            }
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-white/40">
            API rate limit max
          </span>
          <input
            className={adminInputClass}
            type="number"
            min={1}
            value={settings.rateLimitMax}
            onChange={(e) =>
              setSettings({
                ...settings,
                rateLimitMax: Number(e.target.value) || 300,
              })
            }
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-white/40">
            Branding accent
          </span>
          <input
            className={adminInputClass}
            value={settings.brandingAccent}
            onChange={(e) =>
              setSettings({ ...settings, brandingAccent: e.target.value })
            }
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-white/40">
            Monthly request soft limit
          </span>
          <input
            className={adminInputClass}
            type="number"
            min={0}
            value={settings.monthlyRequestSoftLimit}
            onChange={(e) =>
              setSettings({
                ...settings,
                monthlyRequestSoftLimit: Number(e.target.value) || 0,
              })
            }
          />
        </label>
        <label className="flex items-center gap-3 md:col-span-2">
          <input
            type="checkbox"
            checked={settings.requireEmailVerification}
            onChange={(e) =>
              setSettings({
                ...settings,
                requireEmailVerification: e.target.checked,
              })
            }
          />
          <span className="text-sm text-white/75">
            Require email verification (stored preference)
          </span>
        </label>
        <div className="md:col-span-2">
          <button type="submit" className={adminBtnPrimary} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
          <p className="mt-3 text-xs text-white/35">
            Last updated {new Date(settings.updatedAt).toLocaleString()}
          </p>
        </div>
      </form>
    </AdminPanel>
  );
}
