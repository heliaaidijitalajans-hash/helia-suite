/**
 * Platform facts for Helia Brain (Admin Panel).
 * Only answers from real Cloud/admin data — never fabricates metrics.
 */

import { getCloudContainer } from "@/server/helia/runtime";

export const INSUFFICIENT_DATA_MESSAGE = "I don't have enough information.";

export type PlatformBrainReply = {
  intent: string;
  summary: string;
  recommendedAction?: string;
  confidence: number;
  insufficientData: boolean;
  evidence: Array<{
    source: string;
    reference: string;
    detail: string;
    observedAt: string;
  }>;
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export async function answerFromPlatformData(
  questionRaw: string
): Promise<PlatformBrainReply | null> {
  const q = questionRaw.trim().toLowerCase();
  if (!q) return null;

  const container = await getCloudContainer();
  const observedAt = new Date().toISOString();

  const wantsUsageToday =
    /(today.*(api|usage|request)|api usage today|requests today|usage today)/i.test(
      q
    ) || /show today'?s api usage/i.test(q);
  const wantsErrors =
    /(recent errors?|error logs?|list.*errors|errors today)/i.test(q);
  const wantsLatency =
    /(response time|latency|slow|why.*(high|slow))/i.test(q);
  const wantsActiveKeys =
    /(active api keys?|how many.*api keys?|api keys?.*exist)/i.test(q);
  const wantsTopApp =
    /(most requests|generated the most|top (app|application|key)|which application)/i.test(
      q
    );
  const wantsToday =
    /(what happened today|today'?s activity|activity today)/i.test(q);
  const wantsHealth =
    /(platform healthy|system healthy|is .+ healthy|health (check|status)|system health)/i.test(
      q
    );

  if (wantsLatency) {
    return {
      intent: "platform_latency",
      summary: INSUFFICIENT_DATA_MESSAGE,
      confidence: 1,
      insufficientData: true,
      evidence: [
        {
          source: "platform",
          reference: "latency",
          detail:
            "No per-request latency time-series is stored in the platform data store.",
          observedAt,
        },
      ],
    };
  }

  if (wantsUsageToday) {
    const [overview, analytics] = await Promise.all([
      container.admin.getOverview(),
      container.admin.getAnalytics(),
    ]);
    return {
      intent: "platform_usage_today",
      summary: `Today's recorded API request events: ${overview.requestsToday}. This month so far: ${analytics.monthRequests} requests (${analytics.monthErrors} errors, error rate ${analytics.errorRate}%).`,
      recommendedAction:
        "Open Admin → Analytics for monthly series, or Logs for request/error detail.",
      confidence: 0.9,
      insufficientData: false,
      evidence: [
        {
          source: "admin.overview",
          reference: "requestsToday",
          detail: String(overview.requestsToday),
          observedAt,
        },
        {
          source: "admin.analytics",
          reference: "monthRequests",
          detail: String(analytics.monthRequests),
          observedAt,
        },
      ],
    };
  }

  if (wantsErrors) {
    const analytics = await container.admin.getAnalytics();
    const raw = await container.audit.list({ limit: 40 });
    const recent = raw
      .filter((l) => l.level === "error" || /error/i.test(l.message))
      .slice(0, 10)
      .map((l) => ({
        createdAt: l.createdAt,
        message: l.message,
        level: l.level,
      }));

    if (analytics.errorLogs === 0 && recent.length === 0) {
      return {
        intent: "platform_errors",
        summary:
          analytics.monthErrors === 0
            ? INSUFFICIENT_DATA_MESSAGE
            : `No recent error-level audit events are stored. Month error count from usage buckets: ${analytics.monthErrors}.`,
        confidence: analytics.monthErrors === 0 ? 1 : 0.8,
        insufficientData: analytics.monthErrors === 0,
        evidence: [
          {
            source: "admin.analytics",
            reference: "monthErrors",
            detail: String(analytics.monthErrors),
            observedAt,
          },
        ],
      };
    }

    const lines = recent
      .slice(0, 5)
      .map((l) => `• ${l.createdAt}: ${l.message}`)
      .join("\n");
    return {
      intent: "platform_errors",
      summary:
        `Recent error signals: ${analytics.errorLogs} error-level log entries in the latest audit window; ${analytics.monthErrors} errors in this month's usage buckets.` +
        (lines ? `\n\nLatest:\n${lines}` : ""),
      recommendedAction: "Review Admin → Logs for full error context.",
      confidence: 0.88,
      insufficientData: false,
      evidence: [
        {
          source: "admin.analytics",
          reference: "errorLogs",
          detail: String(analytics.errorLogs),
          observedAt,
        },
      ],
    };
  }

  if (wantsActiveKeys) {
    const overview = await container.admin.getOverview();
    return {
      intent: "platform_active_keys",
      summary: `Active API keys: ${overview.totals.activeApiKeys} (of ${overview.totals.apiKeys} total keys).`,
      confidence: 0.95,
      insufficientData: false,
      evidence: [
        {
          source: "admin.overview",
          reference: "activeApiKeys",
          detail: String(overview.totals.activeApiKeys),
          observedAt,
        },
      ],
    };
  }

  if (wantsTopApp) {
    const analytics = await container.admin.getAnalytics();
    const top = analytics.topKeys[0];
    if (!top) {
      return {
        intent: "platform_top_application",
        summary: INSUFFICIENT_DATA_MESSAGE,
        confidence: 1,
        insufficientData: true,
        evidence: [
          {
            source: "admin.analytics",
            reference: "topKeys",
            detail: "No API keys with usage data found.",
            observedAt,
          },
        ],
      };
    }
    return {
      intent: "platform_top_application",
      summary: `Highest usage application/key: “${top.name}” with ${top.usageCount} recorded requests${top.lastUsedAt ? ` (last used ${top.lastUsedAt})` : ""}.`,
      confidence: 0.9,
      insufficientData: false,
      evidence: [
        {
          source: "admin.analytics",
          reference: top.id,
          detail: `${top.name}:${top.usageCount}`,
          observedAt,
        },
      ],
    };
  }

  if (wantsToday) {
    const overview = await container.admin.getOverview();
    const activity = overview.latestActivity.slice(0, 8);
    if (activity.length === 0 && overview.requestsToday === 0) {
      return {
        intent: "platform_today",
        summary: INSUFFICIENT_DATA_MESSAGE,
        confidence: 1,
        insufficientData: true,
        evidence: [
          {
            source: "admin.overview",
            reference: "latestActivity",
            detail: "No activity events recorded yet.",
            observedAt,
          },
        ],
      };
    }
    const lines = activity
      .map((a) => `• [${a.type}] ${a.at}: ${a.summary}`)
      .join("\n");
    return {
      intent: "platform_today",
      summary: `Today so far: ${overview.requestsToday} request events. Recent platform activity:\n${lines || "(no detailed activity rows)"}`,
      confidence: 0.85,
      insufficientData: false,
      evidence: [
        {
          source: "admin.overview",
          reference: "latestActivity",
          detail: String(activity.length),
          observedAt,
        },
      ],
    };
  }

  if (wantsHealth) {
    const health = await container.admin.getHealth();
    const services = Object.entries(health.services)
      .map(([name, status]) => `${name}=${status}`)
      .join(", ");
    return {
      intent: "platform_health",
      summary: `Platform status: ${health.status}. Uptime: ${formatUptime(health.uptimeSeconds)}. Services: ${services}. Version: ${health.platformVersion}.`,
      recommendedAction:
        health.status === "healthy"
          ? "No action required; monitor Admin → System Health for changes."
          : "Inspect Admin → System Health and Logs for degraded services.",
      confidence: 0.92,
      insufficientData: false,
      evidence: [
        {
          source: "admin.health",
          reference: "status",
          detail: health.status,
          observedAt: health.checkedAt,
        },
      ],
    };
  }

  // Generic platform stats fallback for broad “how many users/orgs” questions
  if (
    /(how many (users|organizations|projects)|user count|org count)/i.test(q)
  ) {
    const overview = await container.admin.getOverview();
    return {
      intent: "platform_counts",
      summary: `Users: ${overview.totals.users}. Organizations: ${overview.totals.organizations}. Projects: ${overview.totals.projects}. Active API keys: ${overview.totals.activeApiKeys}.`,
      confidence: 0.9,
      insufficientData: false,
      evidence: [
        {
          source: "admin.overview",
          reference: "totals",
          detail: JSON.stringify(overview.totals),
          observedAt,
        },
      ],
    };
  }

  return null;
}
