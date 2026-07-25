/**
 * Live Helia platform queries for Admin Chat.
 * Calls OrganizationService, ProjectService, ApiKeyService, UsageService, Audit, Health.
 * Zero is a valid answer — never fabricate; never say "no live data" when stores respond.
 */

import { getCloudContainer } from "@/server/helia/runtime";
import { resolvePlatformRole } from "@/server/helia/cloud/utils";
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

export type PlatformQueryContext = {
  userId: string;
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ok(
  intent: string,
  sections: Parameters<typeof formatAdminSections>[0],
  evidence: PlatformBrainReply["evidence"],
  confidence = 0.95
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

export async function answerFromPlatformData(
  questionRaw: string,
  ctx: PlatformQueryContext
): Promise<PlatformBrainReply | null> {
  const q = questionRaw.trim().toLowerCase();
  if (!q) return null;

  const container = await getCloudContainer();
  const observedAt = new Date().toISOString();

  const user = await container.db.users.findById(ctx.userId);
  const isAdmin = user ? resolvePlatformRole(user) === "admin" : false;

  const wantsKeys =
    /\b(api\s*keys?|apikeys?)\b/i.test(q) &&
    !/\b(permission|capability|rotate|disable|explain|how (do|does|to)|what (is|are))\b/i.test(
      q
    );
  const wantsProjects = /\bprojects?\b/i.test(q) && !/\bproject structure\b/i.test(q);
  const wantsOrgs = /\b(organizations?|orgs?)\b/i.test(q);
  const wantsUsage =
    /\b(usage|requests? today|api usage|brain requests?|monitoring requests?)\b/i.test(
      q
    );
  const wantsLogs =
    /\b(logs?|recent errors?|error logs?|audit)\b/i.test(q);
  const wantsHealth =
    /\b(health|healthy|platform status|system status|uptime)\b/i.test(q);
  const wantsLatency = /\b(latency|response time)\b/i.test(q);
  const wantsOverview =
    /\b(what happened today|platform overview|dashboard summary|how is the platform)\b/i.test(
      q
    );
  const wantsUsers = /\b(users?|accounts?)\b/i.test(q) && /\b(how many|count|list|show)\b/i.test(q);

  // Count / list phrasing without needing "how many"
  const counting =
    /\b(how many|count|number of|list|show|do i have|are there)\b/i.test(q) ||
    wantsKeys ||
    wantsProjects ||
    wantsOrgs ||
    wantsUsage ||
    wantsLogs ||
    wantsHealth ||
    wantsOverview;

  if (!counting && !wantsLatency) {
    return null;
  }

  if (wantsLatency) {
    return {
      intent: "platform_latency",
      summary: formatAdminSections({
        status: "Unavailable metric",
        summary: NO_LIVE_DATA_MESSAGE,
        recommendation:
          "Per-request latency is not stored in the Helia Cloud usage buckets.",
        nextStep: "Ask for request counts, error totals, or platform health instead.",
      }),
      confidence: 1,
      insufficientData: true,
      evidence: [
        {
          source: "usageService",
          reference: "latency",
          detail: "metric not persisted",
          observedAt,
        },
      ],
    };
  }

  if (wantsKeys) {
    const keys = isAdmin
      ? await container.apiKeys.listAll()
      : await container.apiKeys.listForUser(ctx.userId);
    const active = keys.filter((k) => k.enabled);
    const lines = keys
      .slice(0, 12)
      .map(
        (k) =>
          `• ${k.name} (${k.prefix}…${k.lastFour}) — ${k.enabled ? "active" : "disabled"} — usage ${k.usageCount}`
      )
      .join("\n");

    return ok(
      "api_keys",
      {
        status: "OK",
        summary: isAdmin
          ? `Platform API keys: ${keys.length} total, ${active.length} active.`
          : `Your accessible API keys: ${keys.length} total, ${active.length} active.`,
        extraSections: lines
          ? [{ title: "Keys", body: lines }]
          : [{ title: "Keys", body: "No API keys in the store." }],
        recommendation:
          "Manage keys in Admin → API Keys / Applications. Never share secrets in chat.",
        nextStep: "Ask about usage, permissions, or rotate guidance if needed.",
      },
      [
        {
          source: "ApiKeyService",
          reference: isAdmin ? "listAll" : "listForUser",
          detail: String(keys.length),
          observedAt,
        },
      ]
    );
  }

  if (wantsProjects) {
    const projects = isAdmin
      ? await container.projects.listAll()
      : await container.projects.listForUser(ctx.userId);
    const lines = projects
      .slice(0, 15)
      .map((p) => `• ${p.name} (${p.environment}) — ${p.id}`)
      .join("\n");

    return ok(
      "projects",
      {
        status: "OK",
        summary: `Projects: ${projects.length}.`,
        extraSections: lines
          ? [{ title: "Projects", body: lines }]
          : [{ title: "Projects", body: "No projects in the store." }],
        recommendation: "Open Admin → Organizations / Applications for project detail.",
        nextStep: "Ask about API keys or usage for a project.",
      },
      [
        {
          source: "ProjectService",
          reference: isAdmin ? "listAll" : "listForUser",
          detail: String(projects.length),
          observedAt,
        },
      ]
    );
  }

  if (wantsOrgs) {
    const orgs = isAdmin
      ? await container.organizations.listAll()
      : await container.organizations.listForUser(ctx.userId);
    const lines = orgs
      .slice(0, 15)
      .map((o) => `• ${o.name} (${o.planId}, ${o.status ?? "active"}) — ${o.id}`)
      .join("\n");

    return ok(
      "organizations",
      {
        status: "OK",
        summary: `Organizations: ${orgs.length}.`,
        extraSections: lines
          ? [{ title: "Organizations", body: lines }]
          : [{ title: "Organizations", body: "No organizations in the store." }],
        recommendation: "Open Admin → Organizations for plan and status changes.",
        nextStep: "Ask about projects or API keys next.",
      },
      [
        {
          source: "OrganizationService",
          reference: isAdmin ? "listAll" : "listForUser",
          detail: String(orgs.length),
          observedAt,
        },
      ]
    );
  }

  if (wantsUsage) {
    let summaryText: string;
    let detail: string;
    if (isAdmin) {
      const platform = await container.usage.summarizePlatform();
      const overview = await container.admin.getOverview();
      summaryText = `Month ${platform.month}: ${platform.totals.requests} requests, ${platform.totals.errors} errors, ${platform.totals.brainRequests} brain requests, ${platform.totals.monitoringRequests} monitoring requests. Requests today (audit): ${overview.requestsToday}.`;
      detail = JSON.stringify({
        ...platform.totals,
        requestsToday: overview.requestsToday,
        buckets: platform.bucketCount,
      });
    } else {
      const orgs = await container.organizations.listForUser(ctx.userId);
      const { month, buckets } = await container.usage.summarizeForUserOrgs(
        orgs.map((o) => o.id)
      );
      const totals = buckets.reduce(
        (acc, b) => {
          acc.requests += b.requests;
          acc.errors += b.errors;
          acc.brainRequests += b.brainRequests;
          acc.monitoringRequests += b.monitoringRequests;
          return acc;
        },
        { requests: 0, errors: 0, brainRequests: 0, monitoringRequests: 0 }
      );
      summaryText = `Month ${month}: ${totals.requests} requests, ${totals.errors} errors, ${totals.brainRequests} brain requests, ${totals.monitoringRequests} monitoring requests across your organizations.`;
      detail = JSON.stringify(totals);
    }

    return ok(
      "usage",
      {
        status: "OK",
        summary: summaryText,
        recommendation: "Open Admin → Analytics for series and Admin → Logs for request detail.",
        nextStep: "Ask for recent errors or platform health if investigating incidents.",
      },
      [
        {
          source: "UsageService",
          reference: isAdmin ? "summarizePlatform" : "summarizeForUserOrgs",
          detail,
          observedAt,
        },
      ]
    );
  }

  if (wantsLogs) {
    const logs = await container.audit.list({ limit: 25 });
    const errors = logs.filter(
      (l) => l.level === "error" || /error/i.test(l.message)
    );
    const lines = (errors.length ? errors : logs)
      .slice(0, 10)
      .map((l) => `• [${l.level}/${l.category}] ${l.createdAt}: ${l.message}`)
      .join("\n");

    return ok(
      "logs",
      {
        status: errors.length > 0 ? "Attention" : "OK",
        summary: `Audit window: ${logs.length} entries, ${errors.length} error-like rows.`,
        extraSections: [
          {
            title: errors.length ? "Recent errors" : "Recent logs",
            body: lines || "No audit log rows in the store.",
          },
        ],
        recommendation: "Open Admin → Logs for filters and full history.",
        nextStep: "Paste a specific error if you need root-cause analysis.",
      },
      [
        {
          source: "AuditLogService",
          reference: "list",
          detail: String(logs.length),
          observedAt,
        },
      ]
    );
  }

  if (wantsHealth) {
    const health = await container.admin.getHealth();
    const services = Object.entries(health.services)
      .map(([name, status]) => `${name}=${status}`)
      .join(", ");
    return ok(
      "health",
      {
        status: health.status === "healthy" ? "Healthy" : "Degraded",
        summary: `Platform status: ${health.status}. Uptime: ${formatUptime(health.uptimeSeconds)}. Version: ${health.platformVersion}.`,
        extraSections: [{ title: "Services", body: services }],
        recommendation:
          health.status === "healthy"
            ? "No action required."
            : "Inspect Admin → System Health and Logs.",
        nextStep: "Ask about usage or recent errors if customers report issues.",
      },
      [
        {
          source: "AdminService.getHealth",
          reference: "status",
          detail: health.status,
          observedAt: health.checkedAt,
        },
      ],
      0.96
    );
  }

  if (wantsUsers) {
    const users = await container.db.users.findAll();
    return ok(
      "users",
      {
        status: "OK",
        summary: `Users: ${users.length}.`,
        recommendation: "Open Admin → Users for roles and disable actions.",
        nextStep: "Ask about organizations or API keys.",
      },
      [
        {
          source: "db.users",
          reference: "findAll",
          detail: String(users.length),
          observedAt,
        },
      ]
    );
  }

  if (wantsOverview || /\b(platform|helia)\b/i.test(q)) {
    const [orgs, projects, keys, usage, health] = await Promise.all([
      isAdmin
        ? container.organizations.listAll()
        : container.organizations.listForUser(ctx.userId),
      isAdmin
        ? container.projects.listAll()
        : container.projects.listForUser(ctx.userId),
      isAdmin
        ? container.apiKeys.listAll()
        : container.apiKeys.listForUser(ctx.userId),
      isAdmin
        ? container.usage.summarizePlatform()
        : container.usage.summarizeForUserOrgs(
            (
              await container.organizations.listForUser(ctx.userId)
            ).map((o) => o.id)
          ).then(async (u) => {
            const totals = u.buckets.reduce(
              (acc, b) => {
                acc.requests += b.requests;
                acc.errors += b.errors;
                acc.brainRequests += b.brainRequests;
                acc.monitoringRequests += b.monitoringRequests;
                return acc;
              },
              {
                requests: 0,
                errors: 0,
                brainRequests: 0,
                monitoringRequests: 0,
              }
            );
            return { month: u.month, totals };
          }),
      container.admin.getHealth(),
    ]);

    const usageLine =
      "totals" in usage
        ? `Usage (${usage.month}): ${usage.totals.requests} requests, ${usage.totals.errors} errors, ${usage.totals.brainRequests} brain.`
        : `Usage: unavailable`;

    return ok(
      "overview",
      {
        status: health.status === "healthy" ? "Healthy" : "Degraded",
        summary: `Organizations: ${orgs.length}. Projects: ${projects.length}. API keys: ${keys.length} (${keys.filter((k) => k.enabled).length} active). ${usageLine} Platform: ${health.status}.`,
        recommendation: "Drill into Admin → Analytics, Logs, or API Keys as needed.",
        nextStep: "Ask a specific count (keys, projects, orgs) or paste an error.",
      },
      [
        {
          source: "OrganizationService+ProjectService+ApiKeyService+UsageService",
          reference: "overview",
          detail: `${orgs.length}/${projects.length}/${keys.length}`,
          observedAt,
        },
      ]
    );
  }

  return null;
}
