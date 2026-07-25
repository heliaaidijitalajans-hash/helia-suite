/**
 * Platform facts for Helia Administrator.
 * Only answers from real Cloud/admin data — never fabricates metrics.
 */

import { getCloudContainer } from "@/server/helia/runtime";
import { formatAdminSections } from "./response-format";
import { NO_LIVE_DATA_MESSAGE } from "./system-prompt";

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

function live(
  intent: string,
  sections: Parameters<typeof formatAdminSections>[0],
  evidence: PlatformBrainReply["evidence"],
  confidence = 0.9
): PlatformBrainReply {
  return {
    intent,
    summary: formatAdminSections(sections),
    recommendedAction: sections.recommendation,
    confidence,
    insufficientData: false,
    evidence,
  };
}

function noLive(
  intent: string,
  evidence: PlatformBrainReply["evidence"],
  nextStep?: string
): PlatformBrainReply {
  return {
    intent,
    summary: formatAdminSections({
      status: "Live data",
      summary: NO_LIVE_DATA_MESSAGE,
      recommendation: "Retry after traffic exists, or open the related Admin page.",
      nextStep: nextStep ?? "Ask another platform metric or check Admin → Analytics.",
    }),
    confidence: 1,
    insufficientData: true,
    evidence,
  };
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
    /(recent errors?|error logs?|list.*errors|errors today|summarize errors)/i.test(
      q
    );
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
    /(platform healthy|system healthy|is .+ healthy|health (check|status)|system health|platform status)/i.test(
      q
    );
  const wantsOrgs =
    /(how many organizations?|list organizations?|show organizations?)/i.test(q);
  const wantsProjects =
    /(how many projects?|list projects?|show projects?)/i.test(q);
  const wantsDeploy =
    /(deploy(ment)? status|last deployment|recent deploy)/i.test(q);
  const wantsLastApi =
    /(last api (call|request)|latest api)/i.test(q);

  if (wantsLatency) {
    return noLive(
      "platform_latency",
      [
        {
          source: "platform",
          reference: "latency",
          detail:
            "No per-request latency time-series is stored in the platform data store.",
          observedAt,
        },
      ],
      "Ask about request counts, error rates, or System Health instead."
    );
  }

  if (wantsUsageToday) {
    const [overview, analytics] = await Promise.all([
      container.admin.getOverview(),
      container.admin.getAnalytics(),
    ]);
    return live(
      "platform_usage_today",
      {
        status: "OK",
        summary: `Today's recorded API request events: ${overview.requestsToday}. Month-to-date: ${analytics.monthRequests} requests, ${analytics.monthErrors} errors (${analytics.errorRate}% error rate).`,
        recommendation:
          "Use Admin → Analytics for monthly series and Admin → Logs for request detail.",
        nextStep: "Ask for recent errors or top applications if you need drill-down.",
      },
      [
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
      ]
    );
  }

  if (wantsErrors) {
    const analytics = await container.admin.getAnalytics();
    const raw = await container.audit.list({ limit: 40 });
    const recent = raw
      .filter((l) => l.level === "error" || /error/i.test(l.message))
      .slice(0, 10);

    if (analytics.errorLogs === 0 && recent.length === 0 && analytics.monthErrors === 0) {
      return noLive(
        "platform_errors",
        [
          {
            source: "admin.analytics",
            reference: "errorLogs",
            detail: "0",
            observedAt,
          },
        ],
        "Generate traffic or inspect Admin → Logs after failures appear."
      );
    }

    const lines = recent
      .slice(0, 5)
      .map((l) => `• ${l.createdAt}: ${l.message}`)
      .join("\n");

    return live(
      "platform_errors",
      {
        status: recent.length > 0 || analytics.monthErrors > 0 ? "Attention" : "OK",
        summary: `Error-level audit entries in window: ${analytics.errorLogs}. Month usage errors: ${analytics.monthErrors}.`,
        extraSections: lines
          ? [{ title: "Recent errors", body: lines }]
          : undefined,
        recommendation: "Review Admin → Logs for full context before changing keys or limits.",
        nextStep: "Paste a specific error payload for root-cause analysis.",
      },
      [
        {
          source: "admin.analytics",
          reference: "errorLogs",
          detail: String(analytics.errorLogs),
          observedAt,
        },
      ],
      0.88
    );
  }

  if (wantsActiveKeys) {
    const overview = await container.admin.getOverview();
    return live(
      "platform_active_keys",
      {
        status: "OK",
        summary: `Active API keys: ${overview.totals.activeApiKeys} of ${overview.totals.apiKeys} total.`,
        recommendation: "Disable unused keys and rotate any that may be exposed.",
        nextStep: "Ask about permissions/capabilities or open Admin → API Keys.",
      },
      [
        {
          source: "admin.overview",
          reference: "activeApiKeys",
          detail: String(overview.totals.activeApiKeys),
          observedAt,
        },
      ],
      0.95
    );
  }

  if (wantsTopApp) {
    const analytics = await container.admin.getAnalytics();
    const top = analytics.topKeys[0];
    if (!top) {
      return noLive(
        "platform_top_application",
        [
          {
            source: "admin.analytics",
            reference: "topKeys",
            detail: "empty",
            observedAt,
          },
        ]
      );
    }
    return live(
      "platform_top_application",
      {
        status: "OK",
        summary: `Highest usage application/key: “${top.name}” with ${top.usageCount} recorded requests${top.lastUsedAt ? ` (last used ${top.lastUsedAt})` : ""}.`,
        recommendation: "Confirm this volume matches expected traffic for that application.",
        nextStep: "Ask for today's usage or recent errors tied to platform load.",
      },
      [
        {
          source: "admin.analytics",
          reference: top.id,
          detail: `${top.name}:${top.usageCount}`,
          observedAt,
        },
      ]
    );
  }

  if (wantsToday) {
    const overview = await container.admin.getOverview();
    const activity = overview.latestActivity.slice(0, 8);
    if (activity.length === 0 && overview.requestsToday === 0) {
      return noLive(
        "platform_today",
        [
          {
            source: "admin.overview",
            reference: "latestActivity",
            detail: "empty",
            observedAt,
          },
        ]
      );
    }
    const lines = activity
      .map((a) => `• [${a.type}] ${a.at}: ${a.summary}`)
      .join("\n");
    return live(
      "platform_today",
      {
        status: "OK",
        summary: `Today so far: ${overview.requestsToday} request events.`,
        extraSections: [{ title: "Recent activity", body: lines || "No detailed rows." }],
        recommendation: "Cross-check Admin → Logs if any activity looks unexpected.",
        nextStep: "Ask for recent errors or platform health.",
      },
      [
        {
          source: "admin.overview",
          reference: "latestActivity",
          detail: String(activity.length),
          observedAt,
        },
      ],
      0.85
    );
  }

  if (wantsHealth) {
    const health = await container.admin.getHealth();
    const services = Object.entries(health.services)
      .map(([name, status]) => `${name}=${status}`)
      .join(", ");
    return live(
      "platform_health",
      {
        status: health.status === "healthy" ? "Healthy" : "Degraded",
        summary: `Platform status: ${health.status}. Uptime: ${formatUptime(health.uptimeSeconds)}. Version: ${health.platformVersion}.`,
        extraSections: [{ title: "Services", body: services }],
        recommendation:
          health.status === "healthy"
            ? "No action required; continue monitoring."
            : "Inspect Admin → System Health and Logs for degraded services.",
        nextStep:
          health.status === "healthy"
            ? "Ask about usage or errors if you are investigating a customer report."
            : "Open Admin → System Health now.",
      },
      [
        {
          source: "admin.health",
          reference: "status",
          detail: health.status,
          observedAt: health.checkedAt,
        },
      ],
      0.92
    );
  }

  if (wantsOrgs) {
    const overview = await container.admin.getOverview();
    return live(
      "platform_organizations",
      {
        status: "OK",
        summary: `Organizations: ${overview.totals.organizations}.`,
        recommendation: "Use Admin → Organizations for status and plan details.",
        nextStep: "Ask about projects or active API keys next.",
      },
      [
        {
          source: "admin.overview",
          reference: "organizations",
          detail: String(overview.totals.organizations),
          observedAt,
        },
      ]
    );
  }

  if (wantsProjects) {
    const overview = await container.admin.getOverview();
    return live(
      "platform_projects",
      {
        status: "OK",
        summary: `Projects: ${overview.totals.projects}.`,
        recommendation: "Use Admin → Organizations / Applications for project-scoped resources.",
        nextStep: "Ask about API keys or usage.",
      },
      [
        {
          source: "admin.overview",
          reference: "projects",
          detail: String(overview.totals.projects),
          observedAt,
        },
      ]
    );
  }

  if (wantsDeploy) {
    const overview = await container.admin.getOverview();
    if (!overview.recentDeployments.length) {
      return noLive(
        "platform_deployments",
        [
          {
            source: "admin.overview",
            reference: "recentDeployments",
            detail: "empty",
            observedAt,
          },
        ],
        "Deployment history is not recorded in the current platform store."
      );
    }
    const lines = overview.recentDeployments
      .slice(0, 5)
      .map((d) => `• ${d.at}: ${d.label} (${d.id})`)
      .join("\n");
    return live(
      "platform_deployments",
      {
        status: "OK",
        summary: "Recent deployment records from the platform store.",
        extraSections: [{ title: "Deployments", body: lines }],
        recommendation: "Verify production hostname and health after each deploy.",
        nextStep: "Ask “Is the platform healthy?” after a release.",
      },
      [
        {
          source: "admin.overview",
          reference: "recentDeployments",
          detail: String(overview.recentDeployments.length),
          observedAt,
        },
      ]
    );
  }

  if (wantsLastApi) {
    const overview = await container.admin.getOverview();
    const last = overview.latestActivity.find((a) => a.type === "api");
    if (!last) {
      return noLive(
        "platform_last_api",
        [
          {
            source: "admin.overview",
            reference: "latestActivity",
            detail: "no api rows",
            observedAt,
          },
        ]
      );
    }
    return live(
      "platform_last_api",
      {
        status: "OK",
        summary: `Last observed API activity: ${last.at} — ${last.summary}.`,
        recommendation: "Confirm whether this matches expected client traffic.",
        nextStep: "Ask for today's usage or recent errors.",
      },
      [
        {
          source: "admin.overview",
          reference: "latestActivity.api",
          detail: last.summary,
          observedAt: last.at,
        },
      ]
    );
  }

  if (
    /(how many (users|organizations|projects)|user count|org count)/i.test(q)
  ) {
    const overview = await container.admin.getOverview();
    return live(
      "platform_counts",
      {
        status: "OK",
        summary: `Users: ${overview.totals.users}. Organizations: ${overview.totals.organizations}. Projects: ${overview.totals.projects}. Active API keys: ${overview.totals.activeApiKeys}.`,
        recommendation: "Use Admin pages for row-level inspection.",
        nextStep: "Ask for health or usage if investigating capacity.",
      },
      [
        {
          source: "admin.overview",
          reference: "totals",
          detail: JSON.stringify(overview.totals),
          observedAt,
        },
      ]
    );
  }

  return null;
}
