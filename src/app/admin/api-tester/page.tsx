"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Play,
  ShieldCheck,
} from "lucide-react";
import {
  AdminPanel,
  adminBtnPrimary,
  adminBtnSecondary,
  adminInputClass,
} from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";
import { cn } from "@/lib/cn";
import { EndpointCombobox } from "@/components/admin/api-tester/EndpointCombobox";
import { QueryParamsEditor } from "@/components/admin/api-tester/QueryParamsEditor";
import { CodeExportPanel } from "@/components/admin/api-tester/CodeExportPanel";
import { ResultBanner } from "@/components/admin/api-tester/StatusCards";
import { JsonHighlight } from "@/components/admin/api-tester/JsonHighlight";
import type { CodegenInput } from "@/components/admin/api-tester/codegen";
import {
  loadHistory,
  pushRecentEndpoint,
  saveHistory,
} from "@/components/admin/api-tester/storage";
import {
  buildUrlWithQuery,
  formatBytes,
  isValidJson,
  prettyJson,
  type ExecuteResult,
  type HistoryEntry,
  type HttpMethod,
  type QueryParam,
  type ValidateResult,
} from "@/components/admin/api-tester/types";

const DEFAULT_HEADERS = '{\n  "Accept": "application/json"\n}';
const DEFAULT_BODY = "{\n  \n}";

function nid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function needsBody(method: HttpMethod) {
  return method === "POST" || method === "PUT" || method === "PATCH";
}

export default function AdminApiTesterPage() {
  const [apiKey, setApiKey] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [path, setPath] = useState("/api/apikeys/whoami");
  const [query, setQuery] = useState<QueryParam[]>([]);
  const [headersText, setHeadersText] = useState(DEFAULT_HEADERS);
  const [bodyText, setBodyText] = useState(DEFAULT_BODY);
  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [executedAt, setExecutedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<"validate" | "execute" | null>(
    null
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copiedResp, setCopiedResp] = useState(false);
  const [headersError, setHeadersError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const finalPath = useMemo(
    () => buildUrlWithQuery(path, query),
    [path, query]
  );

  const responseText = useMemo(() => prettyJson(response), [response]);

  const headersValid = isValidJson(headersText);
  const bodyValid =
    !needsBody(method) || !bodyText.trim() || isValidJson(bodyText);

  const parsedHeaders = useMemo(() => {
    if (!headersValid) return {} as Record<string, string>;
    try {
      return JSON.parse(headersText) as Record<string, string>;
    } catch {
      return {};
    }
  }, [headersText, headersValid]);

  const parsedBody = useMemo(() => {
    if (!needsBody(method) || !bodyText.trim() || !bodyValid) return undefined;
    try {
      return JSON.parse(bodyText) as unknown;
    } catch {
      return undefined;
    }
  }, [bodyText, bodyValid, method]);

  const codegenInput: CodegenInput | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    const headers: Record<string, string> = {
      ...parsedHeaders,
    };
    if (apiKey.trim()) {
      if (!headers.Authorization && !headers.authorization) {
        headers.Authorization = `Bearer ${apiKey.trim()}`;
      }
      if (!headers["X-API-Key"] && !headers["x-api-key"]) {
        headers["X-API-Key"] = apiKey.trim();
      }
    }
    if (needsBody(method) && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    return {
      method,
      url: `${window.location.origin}${finalPath}`,
      headers,
      body: needsBody(method) ? parsedBody : undefined,
      apiKey: apiKey.trim() || undefined,
    };
  }, [apiKey, finalPath, method, parsedBody, parsedHeaders]);

  const validate = useCallback(async () => {
    setBusy(true);
    setBusyAction("validate");
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
      setBusyAction(null);
    }
  }, [apiKey]);

  const execute = useCallback(async () => {
    setBusy(true);
    setBusyAction("execute");
    setError(null);
    setHeadersError(null);
    setBodyError(null);
    try {
      if (!isValidJson(headersText)) {
        setHeadersError("Headers must be valid JSON");
        throw new Error("Headers must be valid JSON");
      }
      const headers = JSON.parse(headersText) as Record<string, string>;

      let jsonBody: unknown = undefined;
      if (needsBody(method)) {
        if (bodyText.trim()) {
          if (!isValidJson(bodyText)) {
            setBodyError("Body must be valid JSON");
            throw new Error("Body must be valid JSON");
          }
          jsonBody = JSON.parse(bodyText);
        } else {
          jsonBody = {};
        }
      }

      const pathTemplate = path.trim();
      const res = await adminFetch<ExecuteResult & { ok: boolean }>(
        "/api/admin/tester/execute",
        {
          method: "POST",
          body: JSON.stringify({
            apiKey,
            method,
            path: finalPath,
            headers,
            jsonBody,
          }),
        }
      );

      setStatus(res.status);
      setLatencyMs(res.latencyMs);
      setSizeBytes(res.sizeBytes);
      setResponse(res.body);
      setExecutedAt(res.executedAt ?? new Date().toISOString());

      pushRecentEndpoint(method, pathTemplate.split("?")[0] || pathTemplate);

      const entry: HistoryEntry = {
        id: nid("h"),
        at: res.executedAt ?? new Date().toISOString(),
        method,
        path: finalPath,
        pathTemplate,
        query,
        headersText,
        bodyText,
        status: res.status,
        latencyMs: res.latencyMs,
        sizeBytes: res.sizeBytes,
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, 50);
        saveHistory(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }, [apiKey, bodyText, finalPath, headersText, method, path, query]);

  function reloadFromHistory(item: HistoryEntry) {
    setMethod(item.method);
    setPath(item.pathTemplate || item.path.split("?")[0] || item.path);
    setQuery(item.query ?? []);
    setHeadersText(item.headersText || DEFAULT_HEADERS);
    setBodyText(item.bodyText || DEFAULT_BODY);
    setStatus(item.status);
    setLatencyMs(item.latencyMs);
    setSizeBytes(item.sizeBytes);
    setExecutedAt(item.at);
    setError(null);
  }

  async function copyResponse() {
    await navigator.clipboard.writeText(responseText || "");
    setCopiedResp(true);
    window.setTimeout(() => setCopiedResp(false), 1500);
  }

  function downloadResponse() {
    const blob = new Blob([responseText || ""], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `helia-api-response-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatBody() {
    if (!bodyText.trim()) return;
    try {
      setBodyText(JSON.stringify(JSON.parse(bodyText), null, 2));
      setBodyError(null);
    } catch {
      setBodyError("Body must be valid JSON");
    }
  }

  function formatHeaders() {
    try {
      setHeadersText(JSON.stringify(JSON.parse(headersText), null, 2));
      setHeadersError(null);
    } catch {
      setHeadersError("Headers must be valid JSON");
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "Enter") {
        e.preventDefault();
        if (!busy && apiKey.trim()) void execute();
      }
      if (meta && e.shiftKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        if (!busy && apiKey.trim()) void validate();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apiKey, busy, execute, validate]);

  return (
    <div className="space-y-6">
      <AdminPanel
        title="API Tester"
        description="Postman-style Helia API console — validate keys, craft requests, inspect responses, and export code. Shortcuts: ⌘/Ctrl+Enter run · ⌘/Ctrl+Shift+V validate."
      >
        {error ? (
          <p className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
            {error}
          </p>
        ) : null}

        <div className="space-y-5">
          <label className="block space-y-1.5">
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

          <EndpointCombobox
            method={method}
            path={path}
            onMethodChange={setMethod}
            onPathChange={setPath}
          />

          <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-white/50">
            Final URL:{" "}
            <span className="text-white/80">{finalPath}</span>
          </p>

          <QueryParamsEditor params={query} onChange={setQuery} />

          <label className="block space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                Headers (JSON)
              </span>
              <button
                type="button"
                className={adminBtnSecondary}
                onClick={formatHeaders}
              >
                Pretty format
              </button>
            </div>
            <textarea
              className={cn(
                adminInputClass,
                "min-h-[110px] font-mono text-xs",
                headersError || !headersValid
                  ? "border-red-500/40 focus:border-red-500/50"
                  : ""
              )}
              value={headersText}
              onChange={(e) => {
                setHeadersText(e.target.value);
                setHeadersError(null);
              }}
              spellCheck={false}
            />
            {headersError || !headersValid ? (
              <p className="text-xs text-red-300/90">
                {headersError || "Invalid JSON"}
              </p>
            ) : (
              <p className="text-[11px] text-white/35">
                Add Authorization, Content-Type, X-API-Key, or any custom header.
              </p>
            )}
          </label>

          {needsBody(method) ? (
            <label className="block space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                  Request body (JSON)
                </span>
                <button
                  type="button"
                  className={adminBtnSecondary}
                  onClick={formatBody}
                >
                  Pretty format
                </button>
              </div>
              <textarea
                className={cn(
                  adminInputClass,
                  "min-h-[140px] font-mono text-xs",
                  bodyError || !bodyValid
                    ? "border-red-500/40 focus:border-red-500/50"
                    : ""
                )}
                value={bodyText}
                onChange={(e) => {
                  setBodyText(e.target.value);
                  setBodyError(null);
                }}
                spellCheck={false}
              />
              {bodyError || !bodyValid ? (
                <p className="text-xs text-red-300/90">
                  {bodyError || "Invalid JSON"}
                </p>
              ) : null}
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={adminBtnSecondary}
              disabled={busy || !apiKey.trim()}
              onClick={() => void validate()}
            >
              {busyAction === "validate" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              )}
              Validate API Key
            </button>
            <button
              type="button"
              className={adminBtnPrimary}
              disabled={busy || !apiKey.trim() || !headersValid || !bodyValid}
              onClick={() => void execute()}
            >
              {busyAction === "execute" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="mr-1.5 h-3.5 w-3.5" />
              )}
              {busyAction === "execute" ? "Running…" : "Run request"}
            </button>
          </div>
        </div>
      </AdminPanel>

      {validation ? (
        <AdminPanel
          title="Key context"
          description="Live identity from API key validation."
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-white/35">Organization</dt>
              <dd className="mt-1 text-white/85">
                {validation.organization.name}
                <span className="mt-0.5 block font-mono text-[11px] text-white/40">
                  {validation.organization.id}
                  {validation.organization.status
                    ? ` · ${validation.organization.status}`
                    : ""}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Project</dt>
              <dd className="mt-1 text-white/85">
                {validation.project.name}
                <span className="mt-0.5 block text-[11px] text-white/40">
                  {validation.project.environment}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Application</dt>
              <dd className="mt-1 text-white/85">
                {validation.application.name}
                {validation.application.prefix ? (
                  <span className="mt-0.5 block font-mono text-[11px] text-white/40">
                    {validation.application.prefix}…{validation.application.lastFour}
                    {validation.application.enabled === false ? " · disabled" : ""}
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Permissions</dt>
              <dd className="mt-1 text-white/85">
                {validation.application.permissions.join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Capabilities</dt>
              <dd className="mt-1 text-white/85">
                {validation.application.capabilities.join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Plan</dt>
              <dd className="mt-1 text-white/85">
                {validation.plan.name || validation.organization.planId}
                {validation.plan.limits &&
                Object.keys(validation.plan.limits).length > 0 ? (
                  <span className="mt-0.5 block font-mono text-[11px] text-white/40">
                    {Object.entries(validation.plan.limits)
                      .map(([k, v]) => `${k}:${v}`)
                      .join(" · ")}
                  </span>
                ) : null}
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
              <dt className="text-xs uppercase text-white/35">Last used</dt>
              <dd className="mt-1 text-white/85">
                {validation.application.lastUsedAt
                  ? new Date(validation.application.lastUsedAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </AdminPanel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminPanel
          title="Response"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={response == null}
                onClick={() => void copyResponse()}
              >
                {copiedResp ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                Copy Response
              </button>
              <button
                type="button"
                className={adminBtnSecondary}
                disabled={response == null}
                onClick={downloadResponse}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download JSON
              </button>
            </div>
          }
        >
          <div className="mb-4 space-y-3">
            <ResultBanner
              status={status}
              latencyMs={latencyMs}
              sizeBytes={sizeBytes}
              body={response}
            />
            <div className="flex flex-wrap gap-4 text-xs text-white/50">
              <span>
                Status:{" "}
                <span className="font-mono text-white/80">{status ?? "—"}</span>
              </span>
              <span>
                Latency:{" "}
                <span className="font-mono text-white/80">
                  {latencyMs != null ? `${latencyMs} ms` : "—"}
                </span>
              </span>
              <span>
                Size:{" "}
                <span className="font-mono text-white/80">
                  {sizeBytes != null ? formatBytes(sizeBytes) : "—"}
                </span>
              </span>
              <span>
                Timestamp:{" "}
                <span className="font-mono text-white/80">
                  {executedAt
                    ? new Date(executedAt).toLocaleString()
                    : "—"}
                </span>
              </span>
            </div>
          </div>
          <pre className="max-h-[480px] overflow-auto rounded-xl border border-white/10 bg-[#0d0d0f] p-4 font-mono text-xs leading-relaxed">
            <JsonHighlight text={responseText} />
          </pre>
        </AdminPanel>

        <AdminPanel
          title="Execution history"
          description="Stored in this browser (localStorage)."
        >
          {history.length === 0 ? (
            <p className="text-sm text-white/45">No executions yet.</p>
          ) : (
            <ul className="max-h-[560px] space-y-1 overflow-auto">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.04]"
                    onClick={() => reloadFromHistory(h)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-xs text-white/75">
                        {h.method} {h.path}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-white/35">
                        {new Date(h.at).toLocaleString()}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[11px]",
                        h.status >= 200 && h.status < 300
                          ? "text-emerald-300/90"
                          : "text-orange-300/90"
                      )}
                    >
                      {h.status} · {h.latencyMs}ms
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>

      <AdminPanel
        title="Export & code generator"
        description="Working snippets from the current request — cURL, Fetch, Axios, Python, Go, PHP, C#."
      >
        <CodeExportPanel input={codegenInput} />
      </AdminPanel>
    </div>
  );
}
