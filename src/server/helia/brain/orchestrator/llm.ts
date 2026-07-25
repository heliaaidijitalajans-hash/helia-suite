/**
 * LLM formatter layer.
 * Receives structured context ONLY — never queries platform services.
 * Uses OpenAI when HELIA_LLM_API_KEY / OPENAI_API_KEY is set; otherwise
 * a deterministic formatter that only renders tool JSON (no invented metrics).
 */

import type { LlmContextPacket } from "./context-builder";

function formatSections(parts: {
  status?: string;
  summary: string;
  recommendation?: string;
  nextStep?: string;
  extra?: Array<{ title: string; body: string }>;
}): string {
  const out: string[] = [];
  if (parts.status) out.push(`Status\n${parts.status}`);
  out.push(`Summary\n${parts.summary}`);
  for (const e of parts.extra ?? []) {
    if (e.body.trim()) out.push(`${e.title}\n${e.body}`);
  }
  if (parts.recommendation) out.push(`Recommendation\n${parts.recommendation}`);
  if (parts.nextStep) out.push(`Next Step\n${parts.nextStep}`);
  return out.join("\n\n");
}

function formatFromTools(packet: LlmContextPacket): string {
  const blocks: string[] = [];

  for (const tool of packet.tools) {
    if (!tool.ok) {
      blocks.push(
        formatSections({
          status: "Tool error",
          summary: `${tool.tool} failed: ${tool.error || "unknown"}`,
          nextStep: "Retry or open Admin → System Health.",
        })
      );
      continue;
    }

    const d = tool.data;

    if (tool.intent === "SECURITY" && d.blocked) {
      blocks.push(String(d.message || "This operation is blocked by the Helia security policy."));
      continue;
    }

    if (tool.intent === "API_KEYS") {
      const keys = Array.isArray(d.keys) ? d.keys : [];
      const lines = keys
        .slice(0, 10)
        .map(
          (k: { name?: string; enabled?: boolean; keyEnvironment?: string; usageCount?: number }) =>
            `• ${k.name} — ${k.enabled ? "active" : "disabled"} — ${k.keyEnvironment} — usage ${k.usageCount ?? 0}`
        )
        .join("\n");
      const newest = d.newest as { id?: string; name?: string } | null;
      blocks.push(
        formatSections({
          status: "OK",
          summary: `API keys: ${d.totalKeys ?? 0} total, ${d.active ?? 0} active, ${d.production ?? 0} production (live), ${d.test ?? 0} test.`,
          extra: [
            ...(lines ? [{ title: "Keys", body: lines }] : []),
            ...(newest?.id
              ? [
                  {
                    title: "Newest / most recent",
                    body: `${newest.name} (${newest.id})`,
                  },
                ]
              : []),
          ],
          recommendation:
            "Manage keys in Admin → API Keys. Never expose secrets in chat.",
          nextStep:
            packet.memory.newestApiKeyId &&
            /newest|latest|rotate|that|it/i.test(packet.userMessage)
              ? `Referenced key from context: ${packet.memory.newestApiKeyId}. Confirm rotate/disable in Admin → Applications.`
              : "Ask about usage or rotate guidance for a specific key.",
        })
      );
      continue;
    }

    if (tool.intent === "PROJECTS") {
      const projects = Array.isArray(d.projects) ? d.projects : [];
      const lines = projects
        .slice(0, 12)
        .map(
          (p: { name?: string; environment?: string; id?: string }) =>
            `• ${p.name} (${p.environment}) — ${p.id}`
        )
        .join("\n");
      blocks.push(
        formatSections({
          status: "OK",
          summary: `Projects: ${d.totalProjects ?? 0}.`,
          extra: lines ? [{ title: "Projects", body: lines }] : undefined,
          recommendation: "Open Admin → Organizations for project detail.",
          nextStep: "Ask about API keys or usage next.",
        })
      );
      continue;
    }

    if (tool.intent === "ORGANIZATIONS") {
      const orgs = Array.isArray(d.organizations) ? d.organizations : [];
      const lines = orgs
        .slice(0, 12)
        .map(
          (o: { name?: string; planId?: string; status?: string }) =>
            `• ${o.name} — ${o.planId} — ${o.status}`
        )
        .join("\n");
      blocks.push(
        formatSections({
          status: "OK",
          summary: `Organizations: ${d.totalOrganizations ?? 0}.`,
          extra: lines ? [{ title: "Organizations", body: lines }] : undefined,
          recommendation: "Open Admin → Organizations for plan changes.",
          nextStep: "Ask about projects or usage.",
        })
      );
      continue;
    }

    if (tool.intent === "USAGE") {
      const totals = (d.totals || {}) as Record<string, number>;
      blocks.push(
        formatSections({
          status: "OK",
          summary: `Usage (${d.month ?? "current"}): ${totals.requests ?? 0} requests, ${totals.errors ?? 0} errors, ${totals.brainRequests ?? 0} brain, ${totals.monitoringRequests ?? 0} monitoring.${
            typeof d.requestsToday === "number"
              ? ` Requests today: ${d.requestsToday}.`
              : ""
          }`,
          recommendation: "Open Admin → Analytics for trends.",
          nextStep: "Ask for logs or health if investigating incidents.",
        })
      );
      continue;
    }

    if (tool.intent === "LOGS") {
      const recent = Array.isArray(d.recent) ? d.recent : [];
      const lines = recent
        .map(
          (l: { level?: string; category?: string; createdAt?: string; message?: string }) =>
            `• [${l.level}/${l.category}] ${l.createdAt}: ${l.message}`
        )
        .join("\n");
      blocks.push(
        formatSections({
          status: (d.errorLike as number) > 0 ? "Attention" : "OK",
          summary: `Audit window: ${d.totalInWindow ?? 0} entries, ${d.errorLike ?? 0} error-like.`,
          extra: [{ title: "Recent", body: lines || "No log rows." }],
          recommendation: "Open Admin → Logs for filters.",
          nextStep: "Paste a specific error for deeper analysis.",
        })
      );
      continue;
    }

    if (tool.intent === "HEALTH") {
      const services = d.services
        ? Object.entries(d.services as Record<string, string>)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")
        : "";
      blocks.push(
        formatSections({
          status: d.status === "healthy" ? "Healthy" : String(d.status || "Unknown"),
          summary: `Platform status: ${d.status}. Uptime: ${d.uptimeSeconds}s. Version: ${d.platformVersion}.`,
          extra: services ? [{ title: "Services", body: services }] : undefined,
          recommendation:
            d.status === "healthy"
              ? "No action required."
              : "Inspect Admin → System Health and Logs.",
          nextStep: "Ask about usage or recent errors if needed.",
        })
      );
      continue;
    }

    if (tool.intent === "ANALYTICS") {
      const top = Array.isArray(d.topKeys) ? d.topKeys : [];
      const topLines = top
        .slice(0, 5)
        .map(
          (k: { name?: string; usageCount?: number }) =>
            `• ${k.name}: ${k.usageCount}`
        )
        .join("\n");
      blocks.push(
        formatSections({
          status: "OK",
          summary: `Analytics: ${d.requestsToday ?? 0} requests today, ${d.monthRequests ?? 0} month requests, ${d.monthErrors ?? 0} month errors (${d.errorRate ?? 0}% error rate), ${d.activeApiKeys ?? 0} active keys.`,
          extra: topLines ? [{ title: "Top keys", body: topLines }] : undefined,
          recommendation: "Open Admin → Analytics for full series.",
          nextStep: "Ask which application generated the most requests.",
        })
      );
      continue;
    }

    if (tool.intent === "DOCUMENTATION") {
      const articles = Array.isArray(d.articles) ? d.articles : [];
      if (!articles.length) {
        blocks.push(
          formatSections({
            status: "Documentation",
            summary: "No documentation found.",
            recommendation:
              "Try Authentication, REST API, API Keys, Webhooks, or Rate Limits.",
            nextStep: "Ask for a language-specific integration example.",
          })
        );
      } else {
        const body = articles
          .map(
            (a: { title?: string; body?: string }) =>
              `### ${a.title}\n${a.body}`
          )
          .join("\n\n");
        blocks.push(
          formatSections({
            status: "Documentation",
            summary: `Matched ${articles.length} Helia documentation article(s).`,
            extra: [{ title: "Details", body }],
            recommendation: "Open Dashboard → Documentation for the full reference.",
            nextStep: "Request a code example if you need an integration snippet.",
          })
        );
      }
      continue;
    }

    if (tool.intent === "CODE_GENERATION" || tool.intent === "INTEGRATIONS") {
      blocks.push(
        formatSections({
          status: "Code generation",
          summary: `Production-ready ${d.language || "integration"} example for ${d.endpoint || "Helia REST"}.`,
          extra: [
            {
              title: String(d.language || "Example"),
              body: "```\n" + String(d.code || "") + "\n```",
            },
          ],
          recommendation: String(
            d.authHeader ||
              "Keep HELIA_API_KEY in server env. Never ship live keys to browsers."
          ),
          nextStep: "Test with a hl_test_ key before production.",
        })
      );
      continue;
    }

    if (tool.intent === "GENERAL") {
      blocks.push(
        formatSections({
          status: "Helia Suite AI Administrator",
          summary:
            "I operate Helia Suite with live platform tools: API keys, projects, organizations, usage, health, logs, analytics, documentation, and integrations.",
          recommendation: "Ask a platform question or request an integration example.",
          nextStep: "Example: How many API Keys do I have?",
        })
      );
      continue;
    }

    // Fallback: dump JSON facts only
    blocks.push(
      formatSections({
        status: "OK",
        summary: `Tool ${tool.tool} returned structured data.`,
        extra: [{ title: "Data", body: "```json\n" + JSON.stringify(d, null, 2) + "\n```" }],
      })
    );
  }

  if (!blocks.length) {
    return formatSections({
      status: "Documentation assistant",
      summary:
        "I can help with Helia APIs, keys, usage, health, logs, and integrations. Ask a platform question and I will query the live services.",
      nextStep: "Try: How many projects? or Show today's usage.",
    });
  }

  return blocks.join("\n\n---\n\n");
}

async function formatWithOpenAi(packet: LlmContextPacket): Promise<string | null> {
  const apiKey =
    process.env.HELIA_LLM_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";
  if (!apiKey) return null;

  const model =
    process.env.HELIA_LLM_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are the Helia Suite response formatter. You receive structured tool JSON only. Never invent platform numbers. Format a clear operator answer. If security.blocked, repeat the security message exactly.",
        },
        {
          role: "user",
          content: JSON.stringify(packet),
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string } }>;
  } | null;
  const text = data?.choices?.[0]?.message?.content?.trim();
  return text || null;
}

export async function formatWithLlm(
  packet: LlmContextPacket
): Promise<{ text: string; mode: "openai" | "deterministic" }> {
  try {
    const ai = await formatWithOpenAi(packet);
    if (ai) return { text: ai, mode: "openai" };
  } catch {
    // fall through
  }
  return { text: formatFromTools(packet), mode: "deterministic" };
}
