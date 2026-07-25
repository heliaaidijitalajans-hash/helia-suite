"use client";

import { cn } from "@/lib/cn";
import { formatBytes } from "./types";

const ERROR_META: Record<
  number,
  { title: string; recommendation: string }
> = {
  400: {
    title: "Bad Request",
    recommendation:
      "Check path params, query values, and JSON body shape against the API docs.",
  },
  401: {
    title: "Unauthorized",
    recommendation:
      "Validate the API key, ensure it is enabled, and confirm Authorization / X-API-Key headers.",
  },
  403: {
    title: "Forbidden",
    recommendation:
      "The key may lack required permissions or capabilities for this endpoint.",
  },
  404: {
    title: "Not Found",
    recommendation:
      "Confirm the path, replace :id placeholders, and verify the resource exists.",
  },
  429: {
    title: "Too Many Requests",
    recommendation:
      "Slow down requests or raise rate limits for this plan / environment.",
  },
  500: {
    title: "Server Error",
    recommendation:
      "Retry shortly. If it persists, check Admin system logs and platform health.",
  },
};

function extractMessage(body: unknown): string {
  if (body == null) return "No error body returned.";
  if (typeof body === "string") return body.slice(0, 280);
  if (typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
    if (o.error && typeof o.error === "object") {
      const e = o.error as Record<string, unknown>;
      if (typeof e.message === "string") return e.message;
    }
  }
  try {
    return JSON.stringify(body).slice(0, 280);
  } catch {
    return "Request failed.";
  }
}

export function SuccessCard({
  status,
  latencyMs,
  sizeBytes,
}: {
  status: number;
  latencyMs: number;
  sizeBytes: number;
}) {
  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
      <p className="text-sm font-semibold text-emerald-100">Request succeeded</p>
      <dl className="mt-2 grid gap-2 text-xs text-emerald-100/80 sm:grid-cols-3">
        <div>
          <dt className="text-emerald-200/50">Status</dt>
          <dd className="mt-0.5 font-mono">{status}</dd>
        </div>
        <div>
          <dt className="text-emerald-200/50">Execution time</dt>
          <dd className="mt-0.5 font-mono">{latencyMs} ms</dd>
        </div>
        <div>
          <dt className="text-emerald-200/50">Response size</dt>
          <dd className="mt-0.5 font-mono">{formatBytes(sizeBytes)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ErrorStatusCard({
  status,
  body,
}: {
  status: number;
  body: unknown;
}) {
  const known = ERROR_META[status];
  const title = known?.title ?? `HTTP ${status}`;
  const recommendation =
    known?.recommendation ??
    "Inspect the response body and retry after adjusting the request.";
  const message = extractMessage(body);

  const tone =
    status === 429
      ? "border-amber-500/25 bg-amber-500/10 text-amber-50"
      : status >= 500
        ? "border-red-500/30 bg-red-500/15 text-red-50"
        : "border-orange-500/25 bg-orange-500/10 text-orange-50";

  return (
    <div className={cn("rounded-xl border px-4 py-3", tone)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">
          {status} · {title}
        </p>
      </div>
      <p className="mt-2 text-xs opacity-90">{message}</p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] opacity-55">
        Recommendation
      </p>
      <p className="mt-1 text-xs opacity-80">{recommendation}</p>
    </div>
  );
}

export function ResultBanner({
  status,
  latencyMs,
  sizeBytes,
  body,
}: {
  status: number | null;
  latencyMs: number | null;
  sizeBytes: number | null;
  body: unknown;
}) {
  if (status == null || latencyMs == null || sizeBytes == null) return null;
  if (status >= 200 && status < 300) {
    return (
      <SuccessCard
        status={status}
        latencyMs={latencyMs}
        sizeBytes={sizeBytes}
      />
    );
  }
  if ([400, 401, 403, 404, 429, 500].includes(status) || status >= 400) {
    return <ErrorStatusCard status={status} body={body} />;
  }
  return null;
}
