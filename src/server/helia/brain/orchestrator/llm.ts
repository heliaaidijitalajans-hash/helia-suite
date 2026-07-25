/**
 * Conversational LLM layer for Helia Chat.
 * Primary path: OpenAI chat completions with tool-grounded reasoning.
 * Fallback: natural prose composed from tool JSON (no invented metrics).
 */

import { HELIA_ADMINISTRATOR_SYSTEM_PROMPT } from "../system-prompt";
import type { LlmContextPacket } from "./context-builder";
import {
  detectReplyLanguage,
  securityBlockedMessage,
  type ReplyLanguage,
} from "./language";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function langOf(packet: LlmContextPacket): ReplyLanguage {
  return packet.replyLanguage ?? detectReplyLanguage(packet.userMessage);
}

/** Build OpenAI-style message list with history + live tool context. */
function buildChatMessages(packet: LlmContextPacket): ChatMessage[] {
  const lang = langOf(packet);
  const langLine =
    lang === "tr"
      ? "Kullanıcıya tamamen Türkçe cevap ver."
      : "Reply entirely in English.";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${HELIA_ADMINISTRATOR_SYSTEM_PROMPT}\n\n${langLine}\n\nRules:\n- ${packet.rules.join("\n- ")}`,
    },
  ];

  // Prior turns (exclude the current user message which is sent separately)
  const prior = packet.memory.recentTurns.slice(0, -1).slice(-10);
  for (const turn of prior) {
    if (turn.role === "user" || turn.role === "assistant") {
      messages.push({ role: turn.role, content: turn.content });
    }
  }

  const liveContext = {
    intents: packet.intents,
    newestApiKeyId: packet.memory.newestApiKeyId ?? null,
    tools: packet.tools,
  };

  messages.push({
    role: "user",
    content: [
      packet.userMessage,
      "",
      "LIVE_PLATFORM_CONTEXT (authoritative — do not invent beyond this):",
      "```json",
      JSON.stringify(liveContext, null, 2),
      "```",
      "",
      "Think carefully, then answer helpfully in natural language.",
    ].join("\n"),
  });

  return messages;
}

async function reasonWithOpenAi(
  packet: LlmContextPacket
): Promise<string | null> {
  const apiKey =
    process.env.HELIA_LLM_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";
  if (!apiKey) return null;

  const model =
    process.env.HELIA_LLM_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.55,
        max_tokens: 1800,
        messages: buildChatMessages(packet),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(
        "[helia-brain] OpenAI error",
        res.status,
        errText.slice(0, 300)
      );
      return null;
    }

    const data = (await res.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string } }>;
    } | null;
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (error) {
    console.error("[helia-brain] OpenAI request failed", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Natural prose fallback when no LLM key / API failure. */
function composeNaturalAnswer(packet: LlmContextPacket): string {
  const lang = langOf(packet);
  const tr = lang === "tr";
  const parts: string[] = [];

  for (const tool of packet.tools) {
    if (!tool.ok) {
      parts.push(
        tr
          ? `${tool.tool} şu an yanıt veremedi (${tool.error || "bilinmeyen hata"}). Admin → System Health veya Logs’a bakmanı öneririm.`
          : `${tool.tool} failed (${tool.error || "unknown error"}). Check Admin → System Health or Logs.`
      );
      continue;
    }

    const d = tool.data;

    if (tool.intent === "SECURITY" && d.blocked) {
      parts.push(
        typeof d.message === "string" && d.message
          ? d.message
          : securityBlockedMessage(lang)
      );
      continue;
    }

    if (tool.intent === "API_KEYS") {
      const keys = Array.isArray(d.keys) ? d.keys : [];
      const lines = keys
        .slice(0, 10)
        .map(
          (k: {
            name?: string;
            enabled?: boolean;
            keyEnvironment?: string;
            usageCount?: number;
          }) =>
            tr
              ? `• **${k.name}** — ${k.enabled ? "aktif" : "pasif"}, ${k.keyEnvironment}, ${k.usageCount ?? 0} kullanım`
              : `• **${k.name}** — ${k.enabled ? "active" : "disabled"}, ${k.keyEnvironment}, ${k.usageCount ?? 0} uses`
        )
        .join("\n");
      parts.push(
        tr
          ? `Şu an **${d.totalKeys ?? 0}** API anahtarı var (aktif: **${d.active ?? 0}**, live: **${d.production ?? 0}**, test: **${d.test ?? 0}**).`
          : `You currently have **${d.totalKeys ?? 0}** API key(s) (active: **${d.active ?? 0}**, live: **${d.production ?? 0}**, test: **${d.test ?? 0}**).`
      );
      if (lines) parts.push(lines);
      const newest = d.newest as { id?: string; name?: string } | null;
      if (newest?.name) {
        parts.push(
          tr
            ? `En yeni anahtar: **${newest.name}** (${newest.id}).`
            : `Newest key: **${newest.name}** (${newest.id}).`
        );
      }
      parts.push(
        tr
          ? `Secret’ları sohbette paylaşma; yönetim için Admin → API Keys kullan.`
          : `Never share secrets in chat; manage keys in Admin → API Keys.`
      );
      continue;
    }

    if (tool.intent === "PROJECTS") {
      const projects = Array.isArray(d.projects) ? d.projects : [];
      parts.push(
        tr
          ? `**${d.totalProjects ?? 0}** proje görünüyor:`
          : `I see **${d.totalProjects ?? 0}** project(s):`
      );
      parts.push(
        projects
          .slice(0, 12)
          .map(
            (p: { name?: string; environment?: string; id?: string }) =>
              `• **${p.name}** (${p.environment}) — \`${p.id}\``
          )
          .join("\n") || (tr ? "• (liste boş)" : "• (empty)")
      );
      continue;
    }

    if (tool.intent === "ORGANIZATIONS") {
      const orgs = Array.isArray(d.organizations) ? d.organizations : [];
      parts.push(
        tr
          ? `**${d.totalOrganizations ?? 0}** organizasyon:`
          : `**${d.totalOrganizations ?? 0}** organization(s):`
      );
      parts.push(
        orgs
          .slice(0, 12)
          .map(
            (o: { name?: string; planId?: string; status?: string }) =>
              `• **${o.name}** — plan \`${o.planId}\`, ${o.status}`
          )
          .join("\n") || (tr ? "• (liste boş)" : "• (empty)")
      );
      continue;
    }

    if (tool.intent === "USAGE") {
      const totals = (d.totals || {}) as Record<string, number>;
      parts.push(
        tr
          ? `**${d.month ?? "bu ay"}** kullanımı: **${totals.requests ?? 0}** istek, **${totals.errors ?? 0}** hata, **${totals.brainRequests ?? 0}** brain, **${totals.monitoringRequests ?? 0}** monitoring.${
              typeof d.requestsToday === "number"
                ? ` Bugün: **${d.requestsToday}** istek.`
                : ""
            }`
          : `Usage for **${d.month ?? "this month"}**: **${totals.requests ?? 0}** requests, **${totals.errors ?? 0}** errors, **${totals.brainRequests ?? 0}** brain, **${totals.monitoringRequests ?? 0}** monitoring.${
              typeof d.requestsToday === "number"
                ? ` Today: **${d.requestsToday}** requests.`
                : ""
            }`
      );
      continue;
    }

    if (tool.intent === "LOGS") {
      const recent = Array.isArray(d.recent) ? d.recent : [];
      parts.push(
        tr
          ? `Audit penceresinde **${d.totalInWindow ?? 0}** kayıt var; **${d.errorLike ?? 0}** hata benzeri olay.`
          : `Audit window shows **${d.totalInWindow ?? 0}** entries with **${d.errorLike ?? 0}** error-like events.`
      );
      if (recent.length) {
        parts.push(
          recent
            .slice(0, 8)
            .map(
              (l: {
                level?: string;
                category?: string;
                createdAt?: string;
                message?: string;
              }) =>
                `• [${l.level}/${l.category}] ${l.createdAt}: ${l.message}`
            )
            .join("\n")
        );
      }
      continue;
    }

    if (tool.intent === "HEALTH") {
      parts.push(
        tr
          ? `Platform durumu **${d.status}**. Uptime **${d.uptimeSeconds}s**, sürüm **${d.platformVersion}**.`
          : `Platform status is **${d.status}**. Uptime **${d.uptimeSeconds}s**, version **${d.platformVersion}**.`
      );
      if (d.services && typeof d.services === "object") {
        const services = Object.entries(d.services as Record<string, string>)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ");
        if (services) {
          parts.push(tr ? `Servisler: ${services}` : `Services: ${services}`);
        }
      }
      continue;
    }

    if (tool.intent === "ANALYTICS") {
      parts.push(
        tr
          ? `Analitik özeti: bugün **${d.requestsToday ?? 0}** istek, bu ay **${d.monthRequests ?? 0}** istek / **${d.monthErrors ?? 0}** hata (oran %${d.errorRate ?? 0}), **${d.activeApiKeys ?? 0}** aktif anahtar.`
          : `Analytics snapshot: **${d.requestsToday ?? 0}** requests today, **${d.monthRequests ?? 0}** month requests / **${d.monthErrors ?? 0}** errors (${d.errorRate ?? 0}% rate), **${d.activeApiKeys ?? 0}** active keys.`
      );
      const top = Array.isArray(d.topKeys) ? d.topKeys : [];
      if (top.length) {
        parts.push(
          top
            .slice(0, 5)
            .map(
              (k: { name?: string; usageCount?: number }) =>
                `• ${k.name}: ${k.usageCount}`
            )
            .join("\n")
        );
      }
      continue;
    }

    if (tool.intent === "DOCUMENTATION") {
      const articles = Array.isArray(d.articles) ? d.articles : [];
      if (!articles.length) {
        parts.push(
          tr
            ? `Bu soru için dokümantasyon kaydı bulamadım. Authentication, API Keys, REST API, Webhooks veya Rate Limits diye sorabilirsin.`
            : `I couldn’t find matching docs. Try Authentication, API Keys, REST API, Webhooks, or Rate Limits.`
        );
      } else {
        parts.push(
          tr
            ? `Helia dokümantasyonundan ${articles.length} eşleşme buldum:`
            : `I found ${articles.length} matching Helia doc article(s):`
        );
        for (const a of articles.slice(0, 3) as Array<{
          title?: string;
          body?: string;
        }>) {
          parts.push(`### ${a.title}\n${a.body}`);
        }
      }
      continue;
    }

    if (tool.intent === "CODE_GENERATION" || tool.intent === "INTEGRATIONS") {
      parts.push(
        tr
          ? `${d.endpoint || "Helia REST"} için **${d.language || "entegrasyon"}** örneği:`
          : `Here’s a **${d.language || "integration"}** example for ${d.endpoint || "Helia REST"}:`
      );
      parts.push("```\n" + String(d.code || "") + "\n```");
      parts.push(
        String(
          d.authHeader ||
            (tr
              ? "Header: `Authorization: Bearer <HELIA_API_KEY>` — key’i sadece sunucu ortamında tut."
              : "Header: `Authorization: Bearer <HELIA_API_KEY>` — keep the key server-side only.")
        )
      );
      continue;
    }

    if (tool.intent === "GENERAL") {
      parts.push(
        tr
          ? `Merhaba — ben Helia Suite AI’yım. API anahtarları, projeler, organizasyonlar, kullanım, sağlık, loglar, analitik, dokümantasyon ve entegrasyon kodunda yardımcı olurum.\n\nÖrnek sorular: “Kaç API anahtarım var?”, “Platform sağlıklı mı?”, “whoami için Node örneği yaz.”`
          : `Hi — I’m Helia Suite AI. I can help with API keys, projects, organizations, usage, health, logs, analytics, documentation, and integration code.\n\nTry: “How many API keys do I have?”, “Is the platform healthy?”, or “Write a Node whoami example.”`
      );
      continue;
    }

    parts.push(
      tr
        ? `${tool.tool} verisi alındı — detay için Admin paneline bakabilir veya daha spesifik sorabilirsin.`
        : `${tool.tool} returned data — open the Admin panel or ask a more specific follow-up.`
    );
  }

  if (!parts.length) {
    return tr
      ? `Helia API’leri, anahtarlar, kullanım, sağlık, loglar ve entegrasyonlarda yardımcı olabilirim. Ne öğrenmek istiyorsun?`
      : `I can help with Helia APIs, keys, usage, health, logs, and integrations. What would you like to know?`;
  }

  return parts.join("\n\n");
}

export async function formatWithLlm(
  packet: LlmContextPacket
): Promise<{ text: string; mode: "openai" | "deterministic" }> {
  const { sanitizeAssistantOutput } = await import("./sanitize");

  try {
    const ai = await reasonWithOpenAi(packet);
    if (ai) {
      return { text: sanitizeAssistantOutput(ai), mode: "openai" };
    }
  } catch (error) {
    console.error("[helia-brain] conversational LLM failed", error);
  }

  return {
    text: sanitizeAssistantOutput(composeNaturalAnswer(packet)),
    mode: "deterministic",
  };
}
