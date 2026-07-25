"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { PathParamsEditor } from "@/components/admin/api-tester/PathParamsEditor";
import { CodeExportPanel } from "@/components/admin/api-tester/CodeExportPanel";
import {
  ResultBanner,
  TransportErrorCard,
} from "@/components/admin/api-tester/StatusCards";
import { CollapsibleJson } from "@/components/admin/api-tester/CollapsibleJson";
import type { CodegenInput } from "@/components/admin/api-tester/codegen";
import {
  loadHistory,
  pushRecentEndpoint,
  saveHistory,
} from "@/components/admin/api-tester/storage";
import {
  applyPathParams,
  buildUrlWithQuery,
  formatBytes,
  isValidJson,
  matchCatalogRoute,
  prettyJson,
  type CatalogRoute,
  type ExecuteResult,
  type HistoryEntry,
  type HttpMethod,
  type PathParam,
  type QueryParam,
  type ValidateResult,
} from "@/components/admin/api-tester/types";

const DEFAULT_HEADERS = '{\n  "Accept": "application/json"\n}';

function nid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function needsBody(method: HttpMethod) {
  return method === "POST" || method === "PUT" || method === "PATCH";
}

export default function AdminApiTesterPage() {
  const [routes, setRoutes] = useState<CatalogRoute[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [pathTemplate, setPathTemplate] = useState("/api/apikeys/whoami");
  const [pathParams, setPathParams] = useState<PathParam[]>([]);
  const [query, setQuery] = useState<QueryParam[]>([]);
  const [headersText, setHeadersText] = useState(DEFAULT_HEADERS);
  const [bodyText, setBodyText] = useState("{\n  \n}");
  const [multipartNote, setMultipartNote] = useState(false);

  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [executedAt, setExecutedAt] = useState<string | null>(null);
  const [upstreamOk, setUpstreamOk] = useState<boolean | null>(null);
  const [implemented, setImplemented] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<"validate" | "execute" | null>(
    null
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copiedResp, setCopiedResp] = useState(false);
  const [headersError, setHeadersError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(
      loadHistory().map((h) => ({
        ...h,
        pathParams: h.pathParams ?? [],
      }))
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const res = await adminFetch<{
          routes: CatalogRoute[];
          count: number;
        }>("/api/admin/tester/catalog");
        if (cancelled) return;
        setRoutes(res.routes);
        const whoami = res.routes.find((r) => r.path === "/api/apikeys/whoami");
        if (whoami) {
          applyRouteSelection(whoami, whoami.methods[0] || "GET");
        }
      } catch (err) {
        if (!cancelled) {
          setCatalogError(
            err instanceof Error ? err.message : "Failed to load API catalog"
          );
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyRouteSelection(route: CatalogRoute, nextMethod: HttpMethod) {
    setPathTemplate(route.path);
    setMethod(nextMethod);
    setPathParams(
      route.pathParameters.map((key) => ({
        id: nid("p"),
        key,
        value: "",
      }))
    );
    setQuery(
      route.queryParameters.map((key) => ({
        id: nid("q"),
        key,
        value: "",
        enabled: true,
      }))
    );
    if (needsBody(nextMethod) && route.bodySchemaHint) {
      setBodyText(route.bodySchemaHint);
    } else if (!needsBody(nextMethod)) {
      setBodyText("{\n  \n}");
    }
    setMultipartNote(route.multipart);
  }

  const resolvedPath = useMemo(
    () => applyPathParams(pathTemplate, pathParams),
    [pathTemplate, pathParams]
  );

  const finalPath = useMemo(
    () => buildUrlWithQuery(resolvedPath, query),
    [resolvedPath, query]
  );

  const matchedRoute = useMemo(
    () => matchCatalogRoute(routes, resolvedPath),
    [routes, resolvedPath]
  );

  const notImplemented =
    !catalogLoading &&
    routes.length > 0 &&
    Boolean(resolvedPath.startsWith("/api/")) &&
    !matchedRoute &&
    !resolvedPath.includes(":");

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
    const headers: Record<string, string> = { ...parsedHeaders };
    if (apiKey.trim()) {
      if (!headers.Authorization && !headers.authorization) {
        headers.Authorization = `Bearer ${apiKey.trim()}`;
      }
      if (!headers["X-API-Key"] && !headers["x-api-key"]) {
        headers["X-API-Key"] = apiKey.trim();
      }
    }
    if (
      needsBody(method) &&
      !headers["Content-Type"] &&
      !headers["content-type"]
    ) {
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
    setTransportError(null);
    try {
      const res = await adminFetch<ValidateResult>(
        "/api/admin/tester/validate",
        {
          method: "POST",
          body: JSON.stringify({ apiKey }),
        }
      );
      setValidation(res);
    } catch (err) {
      setValidation(null);
      const message =
        err instanceof Error ? err.message : "Validation failed";
      if (/failed to fetch|network|timeout|dns|abort/i.test(message)) {
        setTransportError(message);
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }, [apiKey]);

  const execute = useCallback(async () => {
    setBusy(true);
    setBusyAction("execute");
    setError(null);
    setTransportError(null);
    setHeadersError(null);
    setBodyError(null);

    if (notImplemented) {
      setStatus(404);
      setLatencyMs(0);
      setSizeBytes(0);
      setUpstreamOk(false);
      setImplemented(false);
      setResponse({
        ok: false,
        error: {
          code: "NOT_IMPLEMENTED",
          message: "This endpoint is not implemented.",
          path: resolvedPath,
        },
      });
      setExecutedAt(new Date().toISOString());
      setBusy(false);
      setBusyAction(null);
      return;
    }

    if (pathParams.some((p) => !p.value.trim())) {
      setError("Fill all path parameters before running the request.");
      setBusy(false);
      setBusyAction(null);
      return;
    }

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

      const res = await adminFetch<ExecuteResult>("/api/admin/tester/execute", {
        method: "POST",
        body: JSON.stringify({
          apiKey,
          method,
          path: finalPath,
          headers,
          jsonBody,
        }),
      });

      setStatus(res.status);
      setLatencyMs(res.latencyMs);
      setSizeBytes(res.sizeBytes);
      setUpstreamOk(res.upstreamOk);
      setImplemented(res.implemented ?? true);
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
        pathParams,
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
      const message = err instanceof Error ? err.message : "Request failed";
      const isClientValidation =
        /Headers must be valid JSON|Body must be valid JSON|path parameters/i.test(
          message
        );
      const isTransport =
        !isClientValidation &&
        (/failed to fetch|networkerror|network request failed|timeout|dns|abort|load failed|fetch failed/i.test(
          message
        ) ||
          err instanceof TypeError);
      if (isTransport) setTransportError(message);
      else setError(message);
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }, [
    apiKey,
    bodyText,
    finalPath,
    headersText,
    method,
    notImplemented,
    pathParams,
    pathTemplate,
    query,
    resolvedPath,
  ]);

  function reloadFromHistory(item: HistoryEntry) {
    setMethod(item.method);
    setPathTemplate(item.pathTemplate || item.path.split("?")[0] || item.path);
    setQuery(item.query ?? []);
    setPathParams(item.pathParams ?? []);
    setHeadersText(item.headersText || DEFAULT_HEADERS);
    setBodyText(item.bodyText || "{\n  \n}");
    setStatus(item.status);
    setLatencyMs(item.latencyMs);
    setSizeBytes(item.sizeBytes);
    setUpstreamOk(item.status >= 200 && item.status < 300);
    setImplemented(true);
    setExecutedAt(item.at);
    setError(null);
    setTransportError(null);
  }

  async function copyResponse() {
    await navigator.clipboard.writeText(responseText || "");
    setCopiedResp(true);
    window.setTimeout(() => setCopiedResp(false), 1500);
  }

  function downloadResponse() {
    const blob = new Blob([responseText || ""], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `helia-api-response-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        description="Postman-style console — endpoints discovered live from src/app/api. Shortcuts: ⌘/Ctrl+Enter run · ⌘/Ctrl+Shift+V validate."
        actions={
          <Link href="/admin/api-explorer" className={adminBtnSecondary}>
            API Explorer
          </Link>
        }
      >
        {catalogLoading ? (
          <p className="mb-4 text-sm text-white/45">Discovering API routes…</p>
        ) : null}
        {catalogError ? (
          <p className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
            {catalogError}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
            {error}
          </p>
        ) : null}
        {transportError ? (
          <div className="mb-4">
            <TransportErrorCard message={transportError} />
          </div>
        ) : null}
        {notImplemented ? (
          <p className="mb-4 rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm text-orange-50">
            This endpoint is not implemented.
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
            routes={routes}
            method={method}
            path={pathTemplate}
            onMethodChange={(m) => {
              setMethod(m);
              if (matchedRoute?.bodySchemaHint && needsBody(m)) {
                setBodyText(matchedRoute.bodySchemaHint);
              }
            }}
            onPathChange={setPathTemplate}
            onPickRoute={applyRouteSelection}
          />

          <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-white/50">
            Final URL: <span className="text-white/80">{finalPath}</span>
            {routes.length > 0 ? (
              <span className="ml-2 text-white/35">
                · {routes.length} discovered routes
              </span>
            ) : null}
          </p>

          <PathParamsEditor params={pathParams} onChange={setPathParams} />
          <QueryParamsEditor params={query} onChange={setQuery} />

          <label className="block space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                Headers (JSON)
              </span>
              <button
                type="button"
                className={adminBtnSecondary}
                onClick={() => {
                  try {
                    setHeadersText(
                      JSON.stringify(JSON.parse(headersText), null, 2)
                    );
                    setHeadersError(null);
                  } catch {
                    setHeadersError("Headers must be valid JSON");
                  }
                }}
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
                  onClick={() => {
                    try {
                      setBodyText(
                        JSON.stringify(JSON.parse(bodyText), null, 2)
                      );
                      setBodyError(null);
                    } catch {
                      setBodyError("Body must be valid JSON");
                    }
                  }}
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
              {multipartNote ? (
                <p className="text-xs text-amber-200/80">
                  This route uses multipart/formData — send files via a dedicated
                  multipart client if required.
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
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Project</dt>
              <dd className="mt-1 text-white/85">{validation.project.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-white/35">Application</dt>
              <dd className="mt-1 text-white/85">
                {validation.application.name}
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
                Copy
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
            {implemented === false ? (
              <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm text-orange-50">
                This endpoint is not implemented.
              </div>
            ) : (
              <ResultBanner
                status={status}
                latencyMs={latencyMs}
                sizeBytes={sizeBytes}
                body={response}
                upstreamOk={upstreamOk}
              />
            )}
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
                  {executedAt ? new Date(executedAt).toLocaleString() : "—"}
                </span>
              </span>
            </div>
          </div>
          {response != null ? (
            <CollapsibleJson value={response} />
          ) : (
            <p className="text-xs text-white/40">
              Run a request to see JSON here.
            </p>
          )}
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
        description="Working snippets from the current request."
      >
        <CodeExportPanel input={codegenInput} />
      </AdminPanel>
    </div>
  );
}
