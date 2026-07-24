"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  CloudPanel,
  cloudInputClass,
} from "@/components/dashboard/cloud/ui";
import { ApiExplorer } from "@/components/dashboard/docs/ApiExplorer";
import { CodeBlock } from "@/components/dashboard/docs/CodeBlock";
import { cn } from "@/lib/cn";

const NAV = [
  { id: "quick-start", title: "Quick Start" },
  { id: "authentication", title: "Authentication" },
  { id: "rest-api", title: "REST API" },
  { id: "code-examples", title: "Code Examples" },
  { id: "sdk", title: "SDK" },
  { id: "error-codes", title: "Error Codes" },
  { id: "api-explorer", title: "API Explorer" },
  { id: "webhooks", title: "Webhooks" },
  { id: "rate-limits", title: "Rate Limits" },
  { id: "best-practices", title: "Best Practices" },
  { id: "changelog", title: "Changelog" },
] as const;

const REST_ENDPOINTS = [
  {
    method: "POST",
    path: "/v1/chat",
    description:
      "Send a message to Helia and receive a structured assistant response for the authenticated workspace.",
    headers: `Authorization: Bearer hl_live_xxxxxxxxx
Content-Type: application/json`,
    body: `{
  "message": "What is my error rate today?",
  "conversationId": null
}`,
    response: `{
  "id": "msg_01HZX…",
  "conversationId": "conv_01HZX…",
  "role": "assistant",
  "content": "Your error rate is 0.4% over the last 24 hours.",
  "createdAt": "2026-07-24T18:00:00.000Z"
}`,
  },
  {
    method: "POST",
    path: "/v1/knowledge/search",
    description:
      "Search indexed knowledge for the workspace and return ranked passages with citations.",
    headers: `Authorization: Bearer hl_live_xxxxxxxxx
Content-Type: application/json`,
    body: `{
  "query": "How do rate limits work?",
  "limit": 5
}`,
    response: `{
  "results": [
    {
      "id": "doc_rate_limits",
      "title": "Rate Limits",
      "snippet": "Helia enforces per-minute and monthly quotas…",
      "score": 0.91
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/v1/monitor/events",
    description:
      "Ingest a monitoring event (metric, log signal, or custom operational event) for usage and alerting pipelines.",
    headers: `Authorization: Bearer hl_live_xxxxxxxxx
Content-Type: application/json`,
    body: `{
  "name": "api.latency",
  "value": 124,
  "unit": "ms",
  "tags": { "service": "checkout" }
}`,
    response: `{
  "accepted": true,
  "eventId": "evt_01HZX…"
}`,
  },
  {
    method: "POST",
    path: "/v1/notifications/send",
    description:
      "Dispatch a notification through a configured channel (email, webhook bridge, or operator alert).",
    headers: `Authorization: Bearer hl_live_xxxxxxxxx
Content-Type: application/json`,
    body: `{
  "channel": "email",
  "to": "ops@example.com",
  "subject": "Helia alert",
  "body": "Error rate exceeded threshold"
}`,
    response: `{
  "queued": true,
  "notificationId": "ntf_01HZX…"
}`,
  },
  {
    method: "GET",
    path: "/v1/usage",
    description:
      "Retrieve current-period usage counters for requests, Brain calls, monitoring ingest, and errors.",
    headers: `Authorization: Bearer hl_live_xxxxxxxxx`,
    body: null,
    response: `{
  "month": "2026-07",
  "requests": 12840,
  "brainRequests": 932,
  "monitoringRequests": 4012,
  "errors": 17
}`,
  },
  {
    method: "GET",
    path: "/v1/account",
    description:
      "Return the account profile bound to the API key, including organization metadata and plan identifiers.",
    headers: `Authorization: Bearer hl_live_xxxxxxxxx`,
    body: null,
    response: `{
  "organizationId": "org_01HZX…",
  "name": "My Workspace",
  "planId": "starter",
  "status": "active"
}`,
  },
] as const;

const CODE_EXAMPLES = [
  {
    language: "javascript",
    label: "JavaScript",
    code: `const res = await fetch("https://api.helia.ai/v1/chat", {
  method: "POST",
  headers: {
    Authorization: "Bearer hl_live_xxxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: "Summarize today's incidents",
  }),
});

const data = await res.json();
console.log(data);`,
  },
  {
    language: "typescript",
    label: "TypeScript",
    code: `type ChatResponse = {
  id: string;
  content: string;
};

const res = await fetch("https://api.helia.ai/v1/chat", {
  method: "POST",
  headers: {
    Authorization: "Bearer hl_live_xxxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ message: "Summarize today's incidents" }),
});

if (!res.ok) throw new Error(\`Helia API error \${res.status}\`);
const data = (await res.json()) as ChatResponse;`,
  },
  {
    language: "python",
    label: "Python",
    code: `import requests

res = requests.post(
    "https://api.helia.ai/v1/chat",
    headers={
        "Authorization": "Bearer hl_live_xxxxxxxxx",
        "Content-Type": "application/json",
    },
    json={"message": "Summarize today's incidents"},
    timeout=30,
)
res.raise_for_status()
print(res.json())`,
  },
  {
    language: "php",
    label: "PHP",
    code: `<?php
$ch = curl_init("https://api.helia.ai/v1/chat");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer hl_live_xxxxxxxxx",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "message" => "Summarize today's incidents",
  ]),
  CURLOPT_RETURNTRANSFER => true,
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
  },
  {
    language: "dart",
    label: "Flutter (Dart)",
    code: `import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> askHelia() async {
  final res = await http.post(
    Uri.parse('https://api.helia.ai/v1/chat'),
    headers: {
      'Authorization': 'Bearer hl_live_xxxxxxxxx',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'message': "Summarize today's incidents"}),
  );
  print(res.body);
}`,
  },
  {
    language: "javascript",
    label: "Node.js",
    code: `import { request } from "node:https";

const body = JSON.stringify({
  message: "Summarize today's incidents",
});

const req = request(
  {
    hostname: "api.helia.ai",
    path: "/v1/chat",
    method: "POST",
    headers: {
      Authorization: "Bearer hl_live_xxxxxxxxx",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  },
  (res) => {
    res.on("data", (chunk) => process.stdout.write(chunk));
  }
);

req.write(body);
req.end();`,
  },
  {
    language: "bash",
    label: "cURL",
    code: `curl https://api.helia.ai/v1/chat \\
  -X POST \\
  -H "Authorization: Bearer hl_live_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Summarize today'"'"'s incidents"}'`,
  },
] as const;

const SDKS = [
  { name: "JavaScript SDK", status: "Coming Soon" },
  { name: "Python SDK", status: "Coming Soon" },
  { name: "PHP SDK", status: "Coming Soon" },
  { name: "Flutter SDK", status: "Coming Soon" },
  { name: "C#", status: "Coming Soon" },
  { name: "Java", status: "Coming Soon" },
  { name: "Go", status: "Coming Soon" },
] as const;

const ERRORS = [
  {
    code: "401",
    name: "Unauthorized",
    meaning:
      "The request is missing an API key, the key is malformed, or the Bearer token is invalid.",
  },
  {
    code: "403",
    name: "Forbidden",
    meaning:
      "The API key is valid but lacks the required capability or permission for this endpoint.",
  },
  {
    code: "404",
    name: "Not Found",
    meaning:
      "The requested resource or endpoint path does not exist for this workspace.",
  },
  {
    code: "429",
    name: "Too Many Requests",
    meaning:
      "You exceeded the per-minute, burst, or monthly quota. Retry after the Retry-After window.",
  },
  {
    code: "500",
    name: "Internal Server Error",
    meaning:
      "Helia encountered an unexpected failure. Retry with exponential backoff and contact Support if it persists.",
  },
] as const;

function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
      {method}
    </span>
  );
}

function matchesQuery(haystack: string, query: string) {
  if (!query.trim()) return true;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

export default function DocumentationPage() {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return new Set(NAV.map((n) => n.id));
    const set = new Set<string>();
    for (const item of NAV) {
      if (item.title.toLowerCase().includes(q)) set.add(item.id);
    }
    // Content-aware filters
    if ("bearer live test rotate 401 403 429".includes(q) || q.includes("auth"))
      set.add("authentication");
    if ("endpoint chat knowledge monitor notification usage account".includes(q) || q.includes("rest") || q.includes("/v1"))
      set.add("rest-api");
    if ("javascript typescript python php flutter dart node curl".includes(q) || q.includes("example") || q.includes("code"))
      set.add("code-examples");
    if ("sdk coming soon csharp java go".includes(q)) set.add("sdk");
    if ("401 403 404 429 500 error".includes(q)) set.add("error-codes");
    if ("explorer run request header".includes(q)) set.add("api-explorer");
    if ("webhook signature retry event".includes(q)) set.add("webhooks");
    if ("rate limit burst quota rpm".includes(q)) set.add("rate-limits");
    if ("security env cache retry best".includes(q)) set.add("best-practices");
    if ("changelog release v1".includes(q)) set.add("changelog");
    if ("quick start api key".includes(q) || q.includes("start"))
      set.add("quick-start");
    return set;
  }, [query]);

  const show = (id: string) => visible.has(id as (typeof NAV)[number]["id"]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Developer Documentation
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Official Helia API reference for authentication, REST endpoints,
            SDKs, webhooks, and operational limits.
          </p>
        </div>

        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
            strokeWidth={1.75}
          />
          <input
            className={cn(cloudInputClass, "pl-10")}
            placeholder="Search documentation…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search documentation"
          />
        </label>

        <nav
          className="flex flex-wrap gap-2"
          aria-label="Documentation sections"
        >
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                show(item.id)
                  ? "border-white/12 bg-white/[0.04] text-white/70 hover:border-accent/30 hover:text-white"
                  : "hidden"
              )}
            >
              {item.title}
            </a>
          ))}
        </nav>
      </div>

      {visible.size === 0 ? (
        <p className="text-sm text-white/45">No matching sections.</p>
      ) : null}

      {show("quick-start") ? (
        <CloudPanel
          title="1. Quick Start"
          description="Connect your application to Helia in three steps."
        >
          <div id="quick-start" className="space-y-5 scroll-mt-28">
            <ol className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Generate an API Key",
                  body: "Open API Keys in the dashboard and create a live or test key with the capabilities your application needs.",
                },
                {
                  step: "2",
                  title: "Copy the API Key",
                  body: "Copy the secret immediately after creation. Helia shows the full key once; store it in a secrets manager.",
                },
                {
                  step: "3",
                  title: "Use it in your application",
                  body: "Send the key on every request using the Authorization header from your server, never from a public client bundle.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent/85">
                    Step {item.step}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                Authorization header
              </p>
              <CodeBlock
                language="bash"
                code={`Authorization: Bearer hl_live_xxxxxxxxx`}
              />
            </div>
          </div>
        </CloudPanel>
      ) : null}

      {show("authentication") ? (
        <CloudPanel
          title="2. Authentication"
          description="All Helia API requests authenticate with a Bearer API key."
        >
          <div id="authentication" className="space-y-5 scroll-mt-28 text-sm text-white/60">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4">
                <p className="text-sm font-medium text-white">Live API Keys</p>
                <p className="mt-1.5 leading-relaxed">
                  Prefix <code className="text-accent/90">hl_live_</code>. Use
                  for production traffic. Enforce least privilege with
                  capabilities and permissions.
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4">
                <p className="text-sm font-medium text-white">Test API Keys</p>
                <p className="mt-1.5 leading-relaxed">
                  Prefix <code className="text-accent/90">hl_test_</code>. Use
                  for staging and local development. Isolate test keys from
                  production data paths.
                </p>
              </div>
            </div>

            <div>
              <p className="font-medium text-white">Bearer Authentication</p>
              <p className="mt-1.5 leading-relaxed">
                Include the key on every request. Do not send keys as query
                parameters.
              </p>
              <div className="mt-3">
                <CodeBlock
                  language="bash"
                  code={`Authorization: Bearer hl_live_xxxxxxxxx`}
                />
              </div>
            </div>

            <ul className="space-y-2 leading-relaxed">
              <li>
                <span className="font-medium text-white">401</span> — Missing or
                invalid credentials. Verify the header format and key value.
              </li>
              <li>
                <span className="font-medium text-white">403</span> — Key is
                authenticated but not authorized for the capability or action.
              </li>
              <li>
                <span className="font-medium text-white">429</span> — Rate limit
                or quota exceeded. Back off and inspect Usage.
              </li>
            </ul>

            <div className="space-y-2 leading-relaxed">
              <p>
                <span className="font-medium text-white">Token security</span> —
                Treat API keys as passwords. Store only in server-side secret
                stores. Rotate immediately after exposure.
              </p>
              <p>
                <span className="font-medium text-white">Key rotation</span> —
                Rotate from API Keys in the dashboard. Update deployments before
                disabling the previous key.
              </p>
              <p>
                <span className="font-medium text-white">Best practices</span> —
                Prefer short-lived operational access, separate live/test keys,
                and never commit secrets to source control.
              </p>
            </div>
          </div>
        </CloudPanel>
      ) : null}

      {show("rest-api") ? (
        <CloudPanel
          title="3. REST API"
          description="Public Helia API surface. Paths are versioned under /v1."
        >
          <div id="rest-api" className="space-y-4 scroll-mt-28">
            {REST_ENDPOINTS.map((ep) => (
              <article
                key={ep.path}
                className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#121214]/80"
              >
                <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                  <MethodBadge method={ep.method} />
                  <code className="text-sm font-medium text-white">
                    {ep.path}
                  </code>
                </div>
                <div className="space-y-4 p-4 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                      Description
                    </p>
                    <p className="mt-1.5 leading-relaxed text-white/60">
                      {ep.description}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                      Headers
                    </p>
                    <CodeBlock language="bash" code={ep.headers} />
                  </div>
                  {ep.body ? (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                        Request Body
                      </p>
                      <CodeBlock language="json" code={ep.body} />
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">
                      No request body for this method.
                    </p>
                  )}
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                      Response Example
                    </p>
                    <CodeBlock language="json" code={ep.response} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CloudPanel>
      ) : null}

      {show("code-examples") ? (
        <CloudPanel
          title="4. Code Examples"
          description="Server-side samples using a live API key."
        >
          <div id="code-examples" className="space-y-4 scroll-mt-28">
            {CODE_EXAMPLES.map((ex) => (
              <div key={ex.label} className="space-y-2">
                <p className="text-sm font-medium text-white">{ex.label}</p>
                <CodeBlock language={ex.language} code={ex.code} />
              </div>
            ))}
          </div>
        </CloudPanel>
      ) : null}

      {show("sdk") ? (
        <CloudPanel
          title="5. SDK"
          description="Official client libraries. Use REST until an SDK is published."
        >
          <div
            id="sdk"
            className="grid gap-3 scroll-mt-28 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SDKS.map((sdk) => (
              <div
                key={sdk.name}
                className="rounded-xl border border-white/[0.08] bg-[#121214]/80 p-4"
              >
                <p className="text-sm font-medium text-white">{sdk.name}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-accent/85">
                  {sdk.status}
                </p>
              </div>
            ))}
          </div>
        </CloudPanel>
      ) : null}

      {show("error-codes") ? (
        <CloudPanel
          title="6. Error Codes"
          description="Standard HTTP statuses returned by the Helia API."
        >
          <div id="error-codes" className="scroll-mt-28 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-medium uppercase tracking-[0.1em] text-white/35">
                  <th className="px-2 py-3 font-medium">Code</th>
                  <th className="px-2 py-3 font-medium">Name</th>
                  <th className="px-2 py-3 font-medium">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {ERRORS.map((row) => (
                  <tr
                    key={row.code}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-2 py-3 font-mono text-accent/90">
                      {row.code}
                    </td>
                    <td className="px-2 py-3 font-medium text-white">
                      {row.name}
                    </td>
                    <td className="px-2 py-3 leading-relaxed text-white/60">
                      {row.meaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CloudPanel>
      ) : null}

      {show("api-explorer") ? (
        <CloudPanel
          title="7. API Explorer"
          description="Interactive request builder. Live gateway execution will attach when the public API is connected."
        >
          <div id="api-explorer" className="scroll-mt-28">
            <ApiExplorer />
          </div>
        </CloudPanel>
      ) : null}

      {show("webhooks") ? (
        <CloudPanel
          title="8. Webhooks"
          description="Event delivery between Helia and your application."
        >
          <div
            id="webhooks"
            className="space-y-4 scroll-mt-28 text-sm leading-relaxed text-white/60"
          >
            <div className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4">
              <p className="font-medium text-white">Incoming Webhooks</p>
              <p className="mt-1.5">
                Receive events from your systems into Helia monitoring or
                automation pipelines. Require HTTPS endpoints and verify
                authenticity before accepting payloads.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4">
              <p className="font-medium text-white">Outgoing Webhooks</p>
              <p className="mt-1.5">
                Helia delivers signed JSON events to your callback URL when
                subscribed incident, usage, or notification events fire.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4">
              <p className="font-medium text-white">Retry Policy</p>
              <p className="mt-1.5">
                Failed deliveries (non-2xx) retry with exponential backoff. After
                the retry budget is exhausted, the event is marked failed and
                visible in delivery logs.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4">
              <p className="font-medium text-white">Signature Verification</p>
              <p className="mt-1.5">
                Verify the{" "}
                <code className="text-accent/90">Helia-Signature</code> header
                using your webhook secret before processing the body.
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                Event Example
              </p>
              <CodeBlock
                language="json"
                code={`{
  "id": "evt_01HZX…",
  "type": "usage.threshold.crossed",
  "createdAt": "2026-07-24T18:00:00.000Z",
  "data": {
    "metric": "requests",
    "threshold": 100000,
    "current": 100412
  }
}`}
              />
            </div>
          </div>
        </CloudPanel>
      ) : null}

      {show("rate-limits") ? (
        <CloudPanel
          title="9. Rate Limits"
          description="Protect platform stability and enforce plan quotas."
        >
          <div
            id="rate-limits"
            className="grid gap-3 scroll-mt-28 md:grid-cols-2"
          >
            {[
              {
                title: "Requests per minute",
                body: "Short-window RPM caps apply per API key. Exceeding the window returns HTTP 429.",
              },
              {
                title: "Burst limit",
                body: "Brief bursts above sustained RPM are allowed within a fixed token bucket, then throttled.",
              },
              {
                title: "Monthly quota",
                body: "Plan-level monthly request and Brain quotas reset on the billing cycle boundary.",
              },
              {
                title: "Usage tracking",
                body: "Inspect live counters under Usage in the dashboard. Metering covers requests, Brain, monitoring, and errors.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4"
              >
                <p className="text-sm font-medium text-white">{card.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </CloudPanel>
      ) : null}

      {show("best-practices") ? (
        <CloudPanel
          title="10. Best Practices"
          description="Operational guidance for production integrations."
        >
          <div
            id="best-practices"
            className="space-y-3 scroll-mt-28 text-sm leading-relaxed text-white/60"
          >
            {[
              {
                title: "Security",
                body: "Scope keys to required capabilities only. Disable unused keys. Audit rotations after staffing changes.",
              },
              {
                title: "API Key Storage",
                body: "Store secrets in a vault or platform secret store. Never embed keys in mobile apps or public repositories.",
              },
              {
                title: "Server-side usage",
                body: "Call Helia from trusted backends, workers, and server actions. Proxy browser clients through your API.",
              },
              {
                title: "Environment variables",
                body: "Load keys from HELIA_API_KEY (or equivalent) per environment. Keep live and test values separated.",
              },
              {
                title: "Retry strategy",
                body: "Retry 429 and 5xx with exponential backoff and jitter. Do not retry 401 or 403 without fixing credentials.",
              },
              {
                title: "Caching",
                body: "Cache idempotent GET results such as account metadata where freshness allows. Do not cache chat completions as source of truth.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4"
              >
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-1.5">{item.body}</p>
              </div>
            ))}
          </div>
        </CloudPanel>
      ) : null}

      {show("changelog") ? (
        <CloudPanel
          title="11. Changelog"
          description="Official Helia API release notes."
        >
          <div id="changelog" className="space-y-4 scroll-mt-28">
            <div className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4">
              <p className="text-sm font-semibold text-white">v1.0</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-white/60">
                <li>Public documentation for Bearer API key authentication</li>
                <li>
                  Documented /v1 REST surface for chat, knowledge, monitoring,
                  notifications, usage, and account
                </li>
                <li>API Explorer console prepared for gateway integration</li>
                <li>Webhook, rate limit, and error reference published</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#121214]/80 p-4">
              <p className="text-sm font-semibold text-white">Future releases</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-white/60">
                <li>Official SDKs (JavaScript, Python, PHP, Flutter, C#, Java, Go)</li>
                <li>Live API Explorer execution against the Helia gateway</li>
                <li>Expanded webhook event catalog and delivery dashboards</li>
              </ul>
            </div>
          </div>
        </CloudPanel>
      ) : null}
    </div>
  );
}
