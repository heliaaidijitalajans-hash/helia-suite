/**
 * Conversational LLM layer for Helia Chat.
 * Primary path: OpenAI chat completions with tool-grounded reasoning.
 * Fallback: natural GPT-style prose from tool JSON (never Durum/Özet templates).
 */

import { HELIA_ADMINISTRATOR_SYSTEM_PROMPT } from "../system-prompt";
import type { LlmContextPacket } from "./context-builder";
import {
  detectReplyLanguage,
  securityBlockedMessage,
  type ReplyLanguage,
} from "./language";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ToolRow = LlmContextPacket["tools"][number];

function langOf(packet: LlmContextPacket): ReplyLanguage {
  return packet.replyLanguage ?? detectReplyLanguage(packet.userMessage);
}

function toolByIntent(
  tools: ToolRow[],
  intent: string
): ToolRow | undefined {
  return tools.find((t) => t.intent === intent && t.ok);
}

/** Build OpenAI-style message list with history + live tool context. */
function buildChatMessages(packet: LlmContextPacket): ChatMessage[] {
  const lang = langOf(packet);
  const langLine =
    lang === "tr"
      ? [
          "Kullanıcıya tamamen Türkçe cevap ver.",
          "ASLA şu etiketleri kullanma (markdown dahil): Durum, Özet, Öneri, Sonraki adım, **Durum:**, **Özet:**.",
          "Kötü örnek: **Durum:** Genel / **Özet:** Merhaba...",
          "İyi örnek: Merhaba — ben Helia Suite AI. Şu an platformda X anahtar görüyorum...",
        ].join(" ")
      : [
          "Reply entirely in English.",
          "NEVER use labels (including markdown): Status, Summary, Recommendation, Next Step, **Status:**, **Summary:**.",
          "Bad: **Status:** General / **Summary:** Hello...",
          "Good: Hi — I'm Helia Suite AI. I currently see X keys on the platform...",
        ].join(" ");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${HELIA_ADMINISTRATOR_SYSTEM_PROMPT}\n\n${langLine}\n\nRules:\n- ${packet.rules.join("\n- ")}`,
    },
  ];

  const prior = packet.memory.recentTurns.slice(0, -1).slice(-10);
  for (const turn of prior) {
    if (turn.role !== "user" && turn.role !== "assistant") continue;
    // Don't feed old Durum/Özet template replies back into the model
    if (
      turn.role === "assistant" &&
      /(\*\*)?(Durum|Özet|Öneri|Sonraki\s*adım|Status|Summary)(\*\*)?\s*:/i.test(
        turn.content
      )
    ) {
      continue;
    }
    messages.push({ role: turn.role, content: turn.content });
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
      lang === "tr"
        ? "ChatGPT gibi doğal bir paragraf yaz. Bölüm başlığı / Durum-Özet şablonu YASAK. Canlı context’teki sayıları kullan."
        : "Write a natural ChatGPT-style paragraph. Section headers / Status-Summary templates are FORBIDDEN. Use numbers from live context.",
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
        temperature: 0.65,
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

/**
 * Detect / dismantle rigid admin templates the model sometimes still emits:
 *   Durum / Özet / **Durum:** / **Özet:** / Status / Summary ...
 * If the reply is mostly empty template fluff, return null so caller can
 * replace with composeNaturalAnswer().
 */
function normalizeAssistantProse(text: string): string | null {
  const raw = text.trim();
  if (!raw) return null;

  const hasRigidLabels =
    /(\*\*)?(Durum|Özet|Öneri|Sonraki\s*adım|Status|Summary|Recommendation|Next\s*Step)(\*\*)?\s*:/i.test(
      raw
    ) ||
    /^(Durum|Özet|Öneri|Sonraki adım|Status|Summary|Recommendation|Next Step)\s*$/im.test(
      raw
    );

  let out = raw
    // **Durum:** value  / Durum: value
    .replace(
      /^\s*(\*\*)?(Durum|Status)(\*\*)?\s*:\s*.*$/gim,
      ""
    )
    .replace(
      /^\s*(\*\*)?(Özet|Summary)(\*\*)?\s*:\s*/gim,
      ""
    )
    .replace(
      /^\s*(\*\*)?(Öneri|Recommendation)(\*\*)?\s*:\s*/gim,
      ""
    )
    .replace(
      /^\s*(\*\*)?(Sonraki\s*adım|Next\s*Step)(\*\*)?\s*:\s*/gim,
      ""
    )
    // Line-only labels (old format)
    .replace(
      /^\s*(Durum|Özet|Öneri|Sonraki adım|Status|Summary|Recommendation|Next Step)\s*$/gim,
      ""
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Generic empty chatbot fluff after stripping → reject
  const fluff =
    /^(merhaba[!.,]?\s*)?(size\s+)?nasıl yardımcı olabilirim\??$/i.test(
      out.replace(/\s+/g, " ").trim()
    ) ||
    /how can i help you\??$/i.test(out.replace(/\s+/g, " ").trim()) ||
    /herhangi bir konuda bilgi almak/i.test(out) ||
    /lütfen sormak istediğiniz/i.test(out) ||
    /please (tell|specify|ask).*(topic|question)/i.test(out);

  if (hasRigidLabels && (fluff || out.length < 40)) {
    return null;
  }

  if (!out) return null;
  return out;
}

/** Single cohesive GPT-style answer from tool results (no Durum/Özet). */
function composeNaturalAnswer(packet: LlmContextPacket): string {
  const lang = langOf(packet);
  const tr = lang === "tr";
  const tools = packet.tools;

  const blocked = tools.find(
    (t) => t.intent === "SECURITY" && t.ok && t.data.blocked
  );
  if (blocked) {
    return typeof blocked.data.message === "string" && blocked.data.message
      ? blocked.data.message
      : securityBlockedMessage(lang);
  }

  const failed = tools.filter((t) => !t.ok);
  if (failed.length && tools.every((t) => !t.ok)) {
    return tr
      ? `Şu an canlı platform verisine ulaşamadım (${failed[0]?.error || "bilinmeyen hata"}). Birazdan tekrar dene veya Admin → System Health’e bak.`
      : `I couldn’t reach live platform data (${failed[0]?.error || "unknown error"}). Retry shortly or check Admin → System Health.`;
  }

  const keys = toolByIntent(tools, "API_KEYS");
  const health = toolByIntent(tools, "HEALTH");
  const analytics = toolByIntent(tools, "ANALYTICS");
  const usage = toolByIntent(tools, "USAGE");
  const projects = toolByIntent(tools, "PROJECTS");
  const orgs = toolByIntent(tools, "ORGANIZATIONS");
  const logs = toolByIntent(tools, "LOGS");
  const docs = toolByIntent(tools, "DOCUMENTATION");
  const code =
    toolByIntent(tools, "CODE_GENERATION") ||
    toolByIntent(tools, "INTEGRATIONS");

  const intents = new Set(packet.intents);
  const onlyGeneral =
    packet.intents.length > 0 &&
    packet.intents.every((i) => i === "GENERAL" || i === "UNKNOWN");

  // —— Greeting / general: one warm GPT-style intro with live snapshot ——
  if (onlyGeneral && !docs && !code) {
    const keyCount = Number(keys?.data.totalKeys ?? 0);
    const active = Number(keys?.data.active ?? 0);
    const status = String(health?.data.status ?? (tr ? "bilinmiyor" : "unknown"));
    const today = Number(
      analytics?.data.requestsToday ?? usage?.data.requestsToday ?? 0
    );

    if (tr) {
      return [
        `Merhaba — ben **Helia Suite AI**. Platformunu seninle birlikte yöneten asistanınım; API anahtarları, kullanım, sağlık, loglar, dokümantasyon ve entegrasyon kodunda yardımcı olurum.`,
        ``,
        `Şu an canlı tarafta gördüğüm özet: platform **${status}**, **${keyCount}** API anahtarı (**${active}** aktif), bugün yaklaşık **${today}** istek.`,
        ``,
        `İstersen doğrudan sor: “Kaç API anahtarım var?”, “401 INVALID_API_KEY neden olur?”, “whoami için Node örneği yaz” veya “Son hataları göster”.`,
      ].join("\n");
    }

    return [
      `Hi — I’m **Helia Suite AI**, your platform operator assistant. I help with API keys, usage, health, logs, docs, and integration code.`,
      ``,
      `Live snapshot: platform is **${status}**, **${keyCount}** API key(s) (**${active}** active), about **${today}** requests today.`,
      ``,
      `Ask me anything like: “How many API keys do I have?”, “Why am I getting 401 INVALID_API_KEY?”, “Write a Node whoami example”, or “Show recent errors”.`,
    ].join("\n");
  }

  const parts: string[] = [];

  if (keys) {
    const list = Array.isArray(keys.data.keys) ? keys.data.keys : [];
    const lines = list
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
        ? `Canlı kayıtta **${keys.data.totalKeys ?? 0}** API anahtarı var (aktif **${keys.data.active ?? 0}**, live **${keys.data.production ?? 0}**, test **${keys.data.test ?? 0}**).`
        : `Live store shows **${keys.data.totalKeys ?? 0}** API key(s) (**${keys.data.active ?? 0}** active, **${keys.data.production ?? 0}** live, **${keys.data.test ?? 0}** test).`
    );
    if (lines) parts.push(lines);
    const newest = keys.data.newest as { id?: string; name?: string } | null;
    if (newest?.name) {
      parts.push(
        tr
          ? `En yenisi **${newest.name}** (\`${newest.id}\`). Secret’ı sohbette paylaşma; yönetim Admin → API Keys üzerinden.`
          : `Newest is **${newest.name}** (\`${newest.id}\`). Don’t paste secrets here — manage them in Admin → API Keys.`
      );
    }
  }

  if (projects) {
    const list = Array.isArray(projects.data.projects)
      ? projects.data.projects
      : [];
    parts.push(
      tr
        ? `**${projects.data.totalProjects ?? 0}** proje görünüyor:`
        : `I see **${projects.data.totalProjects ?? 0}** project(s):`
    );
    parts.push(
      list
        .slice(0, 12)
        .map(
          (p: { name?: string; environment?: string; id?: string }) =>
            `• **${p.name}** (${p.environment}) — \`${p.id}\``
        )
        .join("\n") || (tr ? "• (boş)" : "• (empty)")
    );
  }

  if (orgs) {
    const list = Array.isArray(orgs.data.organizations)
      ? orgs.data.organizations
      : [];
    parts.push(
      tr
        ? `**${orgs.data.totalOrganizations ?? 0}** organizasyon:`
        : `**${orgs.data.totalOrganizations ?? 0}** organization(s):`
    );
    parts.push(
      list
        .slice(0, 12)
        .map(
          (o: { name?: string; planId?: string; status?: string }) =>
            `• **${o.name}** — \`${o.planId}\`, ${o.status}`
        )
        .join("\n") || (tr ? "• (boş)" : "• (empty)")
    );
  }

  if (usage) {
    const totals = (usage.data.totals || {}) as Record<string, number>;
    parts.push(
      tr
        ? `**${usage.data.month ?? "Bu ay"}** kullanımı: **${totals.requests ?? 0}** istek, **${totals.errors ?? 0}** hata, **${totals.brainRequests ?? 0}** brain.${
            typeof usage.data.requestsToday === "number"
              ? ` Bugün **${usage.data.requestsToday}** istek.`
              : ""
          }`
        : `Usage for **${usage.data.month ?? "this month"}**: **${totals.requests ?? 0}** requests, **${totals.errors ?? 0}** errors, **${totals.brainRequests ?? 0}** brain.${
            typeof usage.data.requestsToday === "number"
              ? ` Today: **${usage.data.requestsToday}**.`
              : ""
          }`
    );
  }

  if (analytics && !usage) {
    parts.push(
      tr
        ? `Analitik: bugün **${analytics.data.requestsToday ?? 0}** istek, ay **${analytics.data.monthRequests ?? 0}** / **${analytics.data.monthErrors ?? 0}** hata (%${analytics.data.errorRate ?? 0}), **${analytics.data.activeApiKeys ?? 0}** aktif anahtar.`
        : `Analytics: **${analytics.data.requestsToday ?? 0}** today, **${analytics.data.monthRequests ?? 0}** month requests / **${analytics.data.monthErrors ?? 0}** errors (${analytics.data.errorRate ?? 0}%), **${analytics.data.activeApiKeys ?? 0}** active keys.`
    );
  }

  if (health) {
    parts.push(
      tr
        ? `Platform durumu **${health.data.status}** (uptime ${health.data.uptimeSeconds}s, sürüm ${health.data.platformVersion}).`
        : `Platform status is **${health.data.status}** (uptime ${health.data.uptimeSeconds}s, version ${health.data.platformVersion}).`
    );
  }

  if (logs) {
    const recent = Array.isArray(logs.data.recent) ? logs.data.recent : [];
    parts.push(
      tr
        ? `Audit penceresinde **${logs.data.totalInWindow ?? 0}** kayıt, **${logs.data.errorLike ?? 0}** hata benzeri olay var.`
        : `Audit window: **${logs.data.totalInWindow ?? 0}** entries, **${logs.data.errorLike ?? 0}** error-like.`
    );
    if (recent.length) {
      parts.push(
        recent
          .slice(0, 6)
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
  }

  if (docs) {
    const articles = Array.isArray(docs.data.articles) ? docs.data.articles : [];
    if (!articles.length) {
      parts.push(
        tr
          ? `Bu soruya uyan dokümantasyon bulamadım. Authentication, API Keys, REST veya Rate Limits diye sorabilirsin.`
          : `No matching docs. Try Authentication, API Keys, REST, or Rate Limits.`
      );
    } else {
      parts.push(
        tr
          ? `Dokümantasyondan ${articles.length} eşleşme:`
          : `Matched ${articles.length} doc article(s):`
      );
      for (const a of articles.slice(0, 3) as Array<{
        title?: string;
        body?: string;
      }>) {
        parts.push(`### ${a.title}\n${a.body}`);
      }
    }
  }

  if (code) {
    parts.push(
      tr
        ? `İşte **${code.data.language || "entegrasyon"}** örneği (${code.data.endpoint || "Helia REST"}):`
        : `Here’s a **${code.data.language || "integration"}** example (${code.data.endpoint || "Helia REST"}):`
    );
    parts.push("```\n" + String(code.data.code || "") + "\n```");
    parts.push(
      tr
        ? `Header: \`Authorization: Bearer <HELIA_API_KEY>\` — key’i sadece sunucuda tut.`
        : `Header: \`Authorization: Bearer <HELIA_API_KEY>\` — keep keys server-side only.`
    );
  }

  if (!parts.length) {
    return tr
      ? `Anladım. Helia platformunda API anahtarları, kullanım, sağlık, loglar, dokümantasyon ve kod örneklerinde yardımcı olabilirim — neyi netleştirmek istersin?`
      : `Got it. I can help with Helia API keys, usage, health, logs, docs, and code samples — what should we dig into?`;
  }

  return parts.join("\n\n");
}

export async function formatWithLlm(
  packet: LlmContextPacket
): Promise<{ text: string; mode: "openai" | "deterministic" }> {
  const { sanitizeAssistantOutput } = await import("./sanitize");
  const fallback = () =>
    sanitizeAssistantOutput(composeNaturalAnswer(packet));

  try {
    const ai = await reasonWithOpenAi(packet);
    if (ai) {
      const normalized = normalizeAssistantProse(ai);
      if (normalized) {
        return {
          text: sanitizeAssistantOutput(normalized),
          mode: "openai",
        };
      }
      // Model slipped into Durum/Özet fluff — use our GPT-style composer instead
      return { text: fallback(), mode: "deterministic" };
    }
  } catch (error) {
    console.error("[helia-brain] conversational LLM failed", error);
  }

  return { text: fallback(), mode: "deterministic" };
}
