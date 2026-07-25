"use client";

import { useMemo, useState } from "react";
import {
  AdminPanel,
  adminBtnPrimary,
  adminBtnSecondary,
  adminInputClass,
} from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";
import { cn } from "@/lib/cn";

type HistoryItem = {
  id: string;
  at: string;
  method: string;
  path: string;
  status: number;
  latencyMs: number;
};

type ValidateResult = {
  valid: boolean;
  organization: { id: string; name: string; planId: string };
  project: { id: string; name: string; environment: string };
  application: {
    id: string;
    name: string;
    permissions: string[];
    capabilities: string[];
    usageCount: number;
    lastUsedAt: string | null;
  };
  plan: { limits: Record<string, number> };
  usage: Record<string, unknown>;
  rateLimits: { windowMs: number; max: number };
};

export default function AdminApiTesterPage() {
  const [apiKey, setApiKey] = useState("");
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/apikeys/whoami");
  const [headersText, setHeadersText] = useState('{\n  "Accept": "application/json"\n}');
  const [bodyText, setBodyText] = useState("{\n\n}");
  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const responseText = useMemo(
    () => JSON.stringify(response, null, 2),
    [response]
  );

  async function validate() {
    setBusy(true);
    setError(null);
    try {
      const res = await adminFetch<ValidateResult & { ok: true }>(
        "/api/admin/tester/validate",
        {
          method: "POST",
          body: JSON.stringify({ apiKey }),
        }
      );
      setValidation(res);
    } catch (err) {
      setValidation(null);
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setBusy(false);
    }
  }

  async function execute() {
    setBusy(true);
    setError(null);
    try {
      let headers: Record<string, string> = {};
      try {
        headers = JSON.parse(headersText) as Record<string, string>;
      } catch {
        throw new Error("Headers must be valid JSON");
      }
      let jsonBody: unknown = undefined;
      if (method !== "GET" && bodyText.trim()) {
        jsonBody = JSON.parse(bodyText);
      }
      const res = await adminFetch<{
        status: number;
        latencyMs: number;
        body: unknown;
        ok: boolean;
      }>("/api/admin/tester/execute", {
        method: "POST",
        body: JSON.stringify({
          apiKey,
          method,
          path,
          headers,
          jsonBody,
        }),
      });
      setStatus(res.status);
      setLatencyMs(res.latencyMs);
      setResponse(res.body);
      setHistory((prev) =>
        [
          {
            id: `${Date.now()}`,
            at: new Date().toISOString(),
            method,
            path,
            status: res.status,
            latencyMs: res.latencyMs,
          },
          ...prev,
        ].slice(0, 30)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyResponse() {
    await navigator.clipboard.writeText(responseText || "");
  }

  return (
    <div className="space-y-6">
      <AdminPanel
        title="API Tester"
        description="Validate keys and run GET / POST / DELETE against Helia API — no terminal, no curl."
      >
        {error ? (
          <p className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block space-y-1.5 lg:col-span-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
              API Key
            </span>
            <input
              className={adminInputClass}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="hl_live_… or hl_test_…"
              autoComplete="off"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
              Method
            </span>
            <select
              className={adminInputClass}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option>GET</option>
              <option>POST</option>
              <option>DELETE</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
              Endpoint
            </span>
            <select
              className={adminInputClass}
              value={path}
              onChange={(e) => setPath(e.target.value)}
            >
              <option value="/api/apikeys/whoami">/api/apikeys/whoami</option>
              <option value="/api/organizations/plans">
                /api/organizations/plans
              </option>
            </select>
          </label>

          <label className="block space-y-1.5 lg:col-span-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
              Headers (JSON)
            </span>
            <textarea
              className={cn(adminInputClass, "min-h-[100px] font-mono text-xs")}
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
            />
          </label>

          {method !== "GET" ? (
            <label className="block space-y-1.5 lg:col-span-2">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                JSON body
              </span>
              <textarea
                className={cn(adminInputClass, "min-h-[120px] font-mono text-xs")}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
              />
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <button
              type="button"
              className={adminBtnSecondary}
              disabled={busy || !apiKey.trim()}
              onClick={() => void validate()}
            >
              Validate API Key
            </button>
            <button
              type="button"
              className={adminBtnPrimary}
              disabled={busy || !apiKey.trim()}
              onClick={() => void execute()}
            >
              {busy ? "Running…" : "Run request"}
            </button>
            <button
              type="button"
              className={adminBtnSecondary}
              disabled={!response}
              onClick={() => void copyResponse()}
            >
              Copy response
            </button>
          </div>
        </div>
      </AdminPanel>

      {validation ? (
        <AdminPanel title="Key context" description="Permissions, org, app, limits from live validation.">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-white/35">Organization</dt>
              <dd className="mt-1 text-white/85">{validation.organization.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Application</dt>
              <dd className="mt-1 text-white/85">{validation.application.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Project</dt>
              <dd className="mt-1 text-white/85">{validation.project.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Permissions</dt>
              <dd className="mt-1 text-white/85">
                {validation.application.permissions.join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Capabilities</dt>
              <dd className="mt-1 text-white/85">
                {validation.application.capabilities.join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Rate limits</dt>
              <dd className="mt-1 text-white/85">
                {validation.rateLimits.max} / {validation.rateLimits.windowMs}ms
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Usage count</dt>
              <dd className="mt-1 text-white/85">
                {validation.application.usageCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Last usage</dt>
              <dd className="mt-1 text-white/85">
                {validation.application.lastUsedAt
                  ? new Date(validation.application.lastUsedAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </AdminPanel>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel title="Response">
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-white/50">
            <span>Status: {status ?? "—"}</span>
            <span>Latency: {latencyMs != null ? `${latencyMs} ms` : "—"}</span>
          </div>
          <pre className="max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-[#0d0d0f] p-4 font-mono text-xs text-white/75">
            {responseText || "Run a request to see JSON here."}
          </pre>
        </AdminPanel>

        <AdminPanel title="Execution history" description="This browser session only.">
          {history.length === 0 ? (
            <p className="text-sm text-white/45">No executions yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-2"
                >
                  <span className="font-mono text-xs text-white/70">
                    {h.method} {h.path}
                  </span>
                  <span className="text-xs text-white/40">
                    {h.status} · {h.latencyMs}ms
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
