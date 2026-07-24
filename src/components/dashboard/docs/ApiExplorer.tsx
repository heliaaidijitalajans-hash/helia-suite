"use client";

import { useMemo, useState } from "react";
import {
  CloudField,
  cloudBtnPrimaryClass,
  cloudBtnSecondaryClass,
  cloudInputClass,
} from "@/components/dashboard/cloud/ui";
import { CodeBlock } from "./CodeBlock";
import { cn } from "@/lib/cn";

const ENDPOINTS = [
  { method: "POST", path: "/v1/chat" },
  { method: "POST", path: "/v1/knowledge/search" },
  { method: "POST", path: "/v1/monitor/events" },
  { method: "POST", path: "/v1/notifications/send" },
  { method: "GET", path: "/v1/usage" },
  { method: "GET", path: "/v1/account" },
] as const;

const DEFAULT_BODY: Record<string, string> = {
  "/v1/chat": JSON.stringify(
    {
      message: "Summarize today's incident queue",
      conversationId: null,
    },
    null,
    2
  ),
  "/v1/knowledge/search": JSON.stringify(
    {
      query: "rate limit headers",
      limit: 5,
    },
    null,
    2
  ),
  "/v1/monitor/events": JSON.stringify(
    {
      name: "checkout.latency",
      value: 182,
      unit: "ms",
      tags: { service: "checkout" },
    },
    null,
    2
  ),
  "/v1/notifications/send": JSON.stringify(
    {
      channel: "email",
      to: "ops@example.com",
      subject: "Helia alert",
      body: "Error rate exceeded threshold",
    },
    null,
    2
  ),
  "/v1/usage": "",
  "/v1/account": "",
};

export function ApiExplorer() {
  const [endpoint, setEndpoint] = useState<(typeof ENDPOINTS)[number]["path"]>(
    "/v1/chat"
  );
  const [method, setMethod] = useState("POST");
  const [headersText, setHeadersText] = useState(
    JSON.stringify(
      {
        Authorization: "Bearer hl_live_xxxxxxxxx",
        "Content-Type": "application/json",
      },
      null,
      2
    )
  );
  const [bodyText, setBodyText] = useState(DEFAULT_BODY["/v1/chat"]);
  const [status, setStatus] = useState<string>("—");
  const [elapsedMs, setElapsedMs] = useState<string>("—");
  const [responseText, setResponseText] = useState(
    '{\n  "ready": true,\n  "message": "Select an endpoint and run a request. Live execution will attach when the Helia API gateway is enabled for this explorer."\n}'
  );
  const [running, setRunning] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const selected = useMemo(
    () => ENDPOINTS.find((e) => e.path === endpoint)!,
    [endpoint]
  );

  function onEndpointChange(path: (typeof ENDPOINTS)[number]["path"]) {
    const next = ENDPOINTS.find((e) => e.path === path)!;
    setEndpoint(path);
    setMethod(next.method);
    setBodyText(DEFAULT_BODY[path] ?? "");
    setLocalError(null);
  }

  function formatJson(raw: string): string | null {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return null;
    }
  }

  function runRequest() {
    setRunning(true);
    setLocalError(null);
    const started = performance.now();

    window.setTimeout(() => {
      const headersFormatted = formatJson(headersText);
      if (!headersFormatted) {
        setStatus("400");
        setElapsedMs(`${Math.round(performance.now() - started)} ms`);
        setResponseText(
          JSON.stringify(
            {
              error: {
                code: "invalid_headers",
                message: "Headers must be valid JSON.",
              },
            },
            null,
            2
          )
        );
        setLocalError("Headers JSON is invalid.");
        setRunning(false);
        return;
      }
      setHeadersText(headersFormatted);

      if (method !== "GET" && bodyText.trim()) {
        const bodyFormatted = formatJson(bodyText);
        if (!bodyFormatted) {
          setStatus("400");
          setElapsedMs(`${Math.round(performance.now() - started)} ms`);
          setResponseText(
            JSON.stringify(
              {
                error: {
                  code: "invalid_body",
                  message: "Request body must be valid JSON.",
                },
              },
              null,
              2
            )
          );
          setLocalError("Request body JSON is invalid.");
          setRunning(false);
          return;
        }
        setBodyText(bodyFormatted);
      }

      setStatus("501");
      setElapsedMs(`${Math.round(performance.now() - started)} ms`);
      setResponseText(
        JSON.stringify(
          {
            ok: false,
            error: {
              code: "explorer_not_connected",
              message:
                "API Explorer UI is ready. Live network calls are disabled until the Helia public API gateway is connected to this console.",
              request: {
                method,
                path: selected.path,
              },
            },
          },
          null,
          2
        )
      );
      setRunning(false);
    }, 220);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <CloudField label="Endpoint">
          <select
            className={cloudInputClass}
            value={endpoint}
            onChange={(e) =>
              onEndpointChange(
                e.target.value as (typeof ENDPOINTS)[number]["path"]
              )
            }
          >
            {ENDPOINTS.map((item) => (
              <option key={item.path} value={item.path}>
                {item.method} {item.path}
              </option>
            ))}
          </select>
        </CloudField>
        <CloudField label="Method">
          <select
            className={cloudInputClass}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </CloudField>
      </div>

      <CloudField label="Headers (JSON)">
        <textarea
          className={cn(cloudInputClass, "min-h-[120px] font-mono text-xs")}
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
          spellCheck={false}
        />
      </CloudField>

      {method !== "GET" ? (
        <CloudField label="Request body (JSON)">
          <textarea
            className={cn(cloudInputClass, "min-h-[160px] font-mono text-xs")}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            spellCheck={false}
          />
        </CloudField>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={cloudBtnPrimaryClass}
          disabled={running}
          onClick={runRequest}
        >
          {running ? "Running…" : "Run Request"}
        </button>
        <button
          type="button"
          className={cloudBtnSecondaryClass}
          onClick={() => {
            const formatted = formatJson(responseText);
            if (formatted) setResponseText(formatted);
          }}
        >
          Format JSON
        </button>
        <div className="flex flex-wrap gap-4 text-xs text-white/45">
          <span>
            HTTP Status:{" "}
            <span className="font-medium text-white/80">{status}</span>
          </span>
          <span>
            Execution time:{" "}
            <span className="font-medium text-white/80">{elapsedMs}</span>
          </span>
        </div>
      </div>

      {localError ? (
        <p className="text-xs text-red-200/90">{localError}</p>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-white/40">
          Response
        </p>
        <CodeBlock code={responseText} language="json" />
      </div>
    </div>
  );
}
