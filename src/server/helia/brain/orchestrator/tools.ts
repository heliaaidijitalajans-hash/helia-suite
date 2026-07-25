/**
 * Platform tools — each returns structured JSON only (no prose answers).
 */

import { getCloudContainer } from "@/server/helia/runtime";
import { resolvePlatformRole } from "@/server/helia/cloud/utils";
import { HELIA_DOC_INDEX } from "../documentation-index";
import { EXAMPLES as CODE_EXAMPLES } from "./code-catalog";
import { matchSecurityPolicy } from "../security-policy";
import {
  detectReplyLanguage,
  securityBlockedMessage,
} from "./language";
import type { ConversationMemory, HeliaIntent, ToolResult } from "./types";

async function isAdmin(userId: string): Promise<boolean> {
  const container = await getCloudContainer();
  const user = await container.db.users.findById(userId);
  return user ? resolvePlatformRole(user) === "admin" : false;
}

export async function runApiKeyTool(
  userId: string,
  memory: ConversationMemory
): Promise<ToolResult> {
  const container = await getCloudContainer();
  const admin = await isAdmin(userId);
  const keys = admin
    ? await container.apiKeys.listAll()
    : await container.apiKeys.listForUser(userId);

  const sorted = [...keys].sort((a, b) => {
    const au = a.lastUsedAt || a.createdAt;
    const bu = b.lastUsedAt || b.createdAt;
    return bu.localeCompare(au);
  });

  const data = {
    totalKeys: keys.length,
    active: keys.filter((k) => k.enabled).length,
    disabled: keys.filter((k) => !k.enabled).length,
    production: keys.filter((k) => k.keyEnvironment === "live").length,
    test: keys.filter((k) => k.keyEnvironment === "test").length,
    newest: sorted[0]
      ? {
          id: sorted[0].id,
          name: sorted[0].name,
          enabled: sorted[0].enabled,
          keyEnvironment: sorted[0].keyEnvironment,
          usageCount: sorted[0].usageCount,
          lastUsedAt: sorted[0].lastUsedAt ?? null,
        }
      : null,
    keys: sorted.slice(0, 25).map((k) => ({
      id: k.id,
      name: k.name,
      enabled: k.enabled,
      keyEnvironment: k.keyEnvironment,
      usageCount: k.usageCount,
      lastUsedAt: k.lastUsedAt ?? null,
      prefix: k.prefix,
      lastFour: k.lastFour,
    })),
  };

  memory.entities.apiKeys = data.keys;
  memory.entities.newestApiKeyId = data.newest?.id;

  return { tool: "ApiKeyService", intent: "API_KEYS", ok: true, data };
}

export async function runProjectTool(userId: string): Promise<ToolResult> {
  const container = await getCloudContainer();
  const admin = await isAdmin(userId);
  const projects = admin
    ? await container.projects.listAll()
    : await container.projects.listForUser(userId);

  return {
    tool: "ProjectService",
    intent: "PROJECTS",
    ok: true,
    data: {
      totalProjects: projects.length,
      byEnvironment: {
        production: projects.filter((p) => p.environment === "production").length,
        staging: projects.filter((p) => p.environment === "staging").length,
        development: projects.filter((p) => p.environment === "development")
          .length,
      },
      projects: projects.slice(0, 40).map((p) => ({
        id: p.id,
        name: p.name,
        environment: p.environment,
        organizationId: p.organizationId,
      })),
    },
  };
}

export async function runOrganizationTool(
  userId: string
): Promise<ToolResult> {
  const container = await getCloudContainer();
  const admin = await isAdmin(userId);
  const orgs = admin
    ? await container.organizations.listAll()
    : await container.organizations.listForUser(userId);

  return {
    tool: "OrganizationService",
    intent: "ORGANIZATIONS",
    ok: true,
    data: {
      totalOrganizations: orgs.length,
      organizations: orgs.slice(0, 40).map((o) => ({
        id: o.id,
        name: o.name,
        planId: o.planId,
        status: o.status ?? "active",
      })),
    },
  };
}

export async function runUsageTool(userId: string): Promise<ToolResult> {
  const container = await getCloudContainer();
  const admin = await isAdmin(userId);

  if (admin) {
    const platform = await container.usage.summarizePlatform();
    const overview = await container.admin.getOverview();
    return {
      tool: "UsageService",
      intent: "USAGE",
      ok: true,
      data: {
        scope: "platform",
        month: platform.month,
        requestsToday: overview.requestsToday,
        totals: platform.totals,
        bucketCount: platform.bucketCount,
      },
    };
  }

  const orgs = await container.organizations.listForUser(userId);
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

  return {
    tool: "UsageService",
    intent: "USAGE",
    ok: true,
    data: {
      scope: "user_organizations",
      month,
      totals,
      bucketCount: buckets.length,
    },
  };
}

export async function runLogTool(): Promise<ToolResult> {
  const container = await getCloudContainer();
  const logs = await container.audit.list({ limit: 40 });
  const errors = logs.filter(
    (l) => l.level === "error" || /error/i.test(l.message)
  );

  return {
    tool: "LogService",
    intent: "LOGS",
    ok: true,
    data: {
      totalInWindow: logs.length,
      errorLike: errors.length,
      recent: (errors.length ? errors : logs).slice(0, 12).map((l) => ({
        id: l.id,
        level: l.level,
        category: l.category,
        message: l.message,
        createdAt: l.createdAt,
      })),
    },
  };
}

export async function runHealthTool(): Promise<ToolResult> {
  const container = await getCloudContainer();
  const health = await container.admin.getHealth();
  return {
    tool: "HealthService",
    intent: "HEALTH",
    ok: true,
    data: {
      status: health.status,
      checkedAt: health.checkedAt,
      uptimeSeconds: health.uptimeSeconds,
      platformVersion: health.platformVersion,
      services: health.services,
      memory: health.memory,
    },
  };
}

export async function runDocumentationTool(
  query: string
): Promise<ToolResult> {
  const q = query.toLowerCase();
  const scored = HELIA_DOC_INDEX.map((doc) => {
    let score = 0;
    for (const kw of doc.keywords) {
      if (q.includes(kw)) score += 3;
    }
    for (const token of q.split(/\s+/)) {
      if (token.length > 2 && doc.body.toLowerCase().includes(token)) score += 1;
    }
    return { doc, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    tool: "DocumentationService",
    intent: "DOCUMENTATION",
    ok: true,
    data: {
      found: scored.length > 0,
      articles: scored.map((s) => ({
        id: s.doc.id,
        title: s.doc.title,
        body: s.doc.body,
        score: s.score,
      })),
    },
  };
}

export async function runAnalyticsTool(): Promise<ToolResult> {
  const container = await getCloudContainer();
  const analytics = await container.admin.getAnalytics();
  return {
    tool: "AnalyticsService",
    intent: "ANALYTICS",
    ok: true,
    data: {
      users: analytics.users,
      apiKeys: analytics.apiKeys,
      activeApiKeys: analytics.activeApiKeys,
      requestsToday: analytics.requestsToday,
      monthRequests: analytics.monthRequests,
      monthErrors: analytics.monthErrors,
      errorRate: analytics.errorRate,
      topKeys: analytics.topKeys,
      series: analytics.series.slice(-6),
    },
  };
}

export async function runIntegrationTool(query: string): Promise<ToolResult> {
  const q = query.toLowerCase();
  const targets = [
    "rest",
    "webhook",
    "zapier",
    "n8n",
    "make",
    "nextjs",
    "react",
    "node",
  ].filter((t) => q.includes(t));

  return {
    tool: "IntegrationService",
    intent: "INTEGRATIONS",
    ok: true,
    data: {
      requested: targets.length ? targets : ["rest"],
      note: "Use CodeGenerationService for production-ready snippets.",
    },
  };
}

export async function runCodeGenerationTool(
  query: string
): Promise<ToolResult> {
  const q = query.toLowerCase();
  const match =
    CODE_EXAMPLES.find((e) => e.labels.some((l) => q.includes(l))) ||
    CODE_EXAMPLES.find((e) => e.id === "typescript")!;

  return {
    tool: "CodeGenerationService",
    intent: "CODE_GENERATION",
    ok: true,
    data: {
      language: match.title,
      endpoint: "https://api.helia.ai/v1/chat",
      code: match.code,
      authHeader: "Authorization: Bearer <HELIA_API_KEY>",
    },
  };
}

export async function runSecurityTool(query: string): Promise<ToolResult> {
  const lang = detectReplyLanguage(query);
  const blocked = matchSecurityPolicy(query);
  return {
    tool: "SecurityService",
    intent: "SECURITY",
    ok: true,
    data: {
      blocked: Boolean(blocked),
      message: blocked
        ? securityBlockedMessage(lang)
        : lang === "tr"
          ? "Bu istek için engellenen bir güvenlik işlemi yok."
          : "No blocked security operation detected for this request.",
    },
  };
}

export async function runGeneralTool(
  memory: ConversationMemory
): Promise<ToolResult> {
  return {
    tool: "GeneralAssistant",
    intent: "GENERAL",
    ok: true,
    data: {
      role: "Helia Suite AI Administrator",
      capabilities: [
        "API_KEYS",
        "PROJECTS",
        "ORGANIZATIONS",
        "USAGE",
        "HEALTH",
        "LOGS",
        "DOCUMENTATION",
        "INTEGRATIONS",
        "ANALYTICS",
        "CODE_GENERATION",
      ],
      lastIntents: memory.lastIntents,
    },
  };
}

export async function executeTool(
  intent: HeliaIntent,
  userId: string,
  message: string,
  memory: ConversationMemory
): Promise<ToolResult> {
  try {
    switch (intent) {
      case "API_KEYS":
        return runApiKeyTool(userId, memory);
      case "PROJECTS":
        return runProjectTool(userId);
      case "ORGANIZATIONS":
        return runOrganizationTool(userId);
      case "USAGE":
        return runUsageTool(userId);
      case "LOGS":
        return runLogTool();
      case "HEALTH":
        return runHealthTool();
      case "DOCUMENTATION":
        return runDocumentationTool(message);
      case "ANALYTICS":
        return runAnalyticsTool();
      case "INTEGRATIONS":
        return runIntegrationTool(message);
      case "CODE_GENERATION":
        return runCodeGenerationTool(message);
      case "SECURITY":
        return runSecurityTool(message);
      case "GENERAL":
      case "UNKNOWN":
      default:
        return runGeneralTool(memory);
    }
  } catch (err) {
    return {
      tool: "GeneralAssistant",
      intent,
      ok: false,
      data: {},
      error: err instanceof Error ? err.message : "tool_failed",
    };
  }
}
