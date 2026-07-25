/**
 * LLM formatter layer.
 * Receives structured context ONLY — never queries platform services.
 * Reply language follows the user's message (tr / en).
 */

import type { LlmContextPacket } from "./context-builder";
import {
  detectReplyLanguage,
  securityBlockedMessage,
  uiLabels,
  type ReplyLanguage,
} from "./language";

function formatSections(
  lang: ReplyLanguage,
  parts: {
    status?: string;
    summary: string;
    recommendation?: string;
    nextStep?: string;
    extra?: Array<{ title: string; body: string }>;
  }
): string {
  const L = uiLabels(lang);
  const out: string[] = [];
  if (parts.status) out.push(`${L.status}\n${parts.status}`);
  out.push(`${L.summary}\n${parts.summary}`);
  for (const e of parts.extra ?? []) {
    if (e.body.trim()) out.push(`${e.title}\n${e.body}`);
  }
  if (parts.recommendation) {
    out.push(`${L.recommendation}\n${parts.recommendation}`);
  }
  if (parts.nextStep) out.push(`${L.nextStep}\n${parts.nextStep}`);
  return out.join("\n\n");
}

function formatFromTools(packet: LlmContextPacket): string {
  const lang = packet.replyLanguage ?? detectReplyLanguage(packet.userMessage);
  const L = uiLabels(lang);
  const tr = lang === "tr";
  const blocks: string[] = [];

  for (const tool of packet.tools) {
    if (!tool.ok) {
      blocks.push(
        formatSections(lang, {
          status: L.toolError,
          summary: tr
            ? `${tool.tool} başarısız: ${tool.error || "bilinmeyen hata"}`
            : `${tool.tool} failed: ${tool.error || "unknown"}`,
          nextStep: tr
            ? "Tekrar deneyin veya Admin → System Health’e bakın."
            : "Retry or open Admin → System Health.",
        })
      );
      continue;
    }

    const d = tool.data;

    if (tool.intent === "SECURITY" && d.blocked) {
      blocks.push(
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
              ? `• ${k.name} — ${k.enabled ? "aktif" : "pasif"} — ${k.keyEnvironment} — kullanım ${k.usageCount ?? 0}`
              : `• ${k.name} — ${k.enabled ? "active" : "disabled"} — ${k.keyEnvironment} — usage ${k.usageCount ?? 0}`
        )
        .join("\n");
      const newest = d.newest as { id?: string; name?: string } | null;
      blocks.push(
        formatSections(lang, {
          status: L.ok,
          summary: tr
            ? `API anahtarları: toplam ${d.totalKeys ?? 0}, aktif ${d.active ?? 0}, production (live) ${d.production ?? 0}, test ${d.test ?? 0}.`
            : `API keys: ${d.totalKeys ?? 0} total, ${d.active ?? 0} active, ${d.production ?? 0} production (live), ${d.test ?? 0} test.`,
          extra: [
            ...(lines ? [{ title: L.keys, body: lines }] : []),
            ...(newest?.id
              ? [
                  {
                    title: L.newest,
                    body: `${newest.name} (${newest.id})`,
                  },
                ]
              : []),
          ],
          recommendation: tr
            ? "Anahtarları Admin → API Keys üzerinden yönetin. Sohbette secret paylaşmayın."
            : "Manage keys in Admin → API Keys. Never expose secrets in chat.",
          nextStep:
            packet.memory.newestApiKeyId &&
            /newest|latest|rotate|that|it|yenisini|sonuncuyu|onu|bunu/i.test(
              packet.userMessage
            )
              ? tr
                ? `Bağlamdaki anahtar: ${packet.memory.newestApiKeyId}. Rotate/disable için Admin → Applications’ı kullanın.`
                : `Referenced key from context: ${packet.memory.newestApiKeyId}. Confirm rotate/disable in Admin → Applications.`
              : tr
                ? "Kullanım veya belirli bir anahtar için rotate rehberi isteyin."
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
        formatSections(lang, {
          status: L.ok,
          summary: tr
            ? `Projeler: ${d.totalProjects ?? 0}.`
            : `Projects: ${d.totalProjects ?? 0}.`,
          extra: lines ? [{ title: L.projects, body: lines }] : undefined,
          recommendation: tr
            ? "Proje detayı için Admin → Organizations’a bakın."
            : "Open Admin → Organizations for project detail.",
          nextStep: tr
            ? "Ardından API anahtarları veya kullanımı sorun."
            : "Ask about API keys or usage next.",
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
        formatSections(lang, {
          status: L.ok,
          summary: tr
            ? `Organizasyonlar: ${d.totalOrganizations ?? 0}.`
            : `Organizations: ${d.totalOrganizations ?? 0}.`,
          extra: lines ? [{ title: L.organizations, body: lines }] : undefined,
          recommendation: tr
            ? "Plan değişiklikleri için Admin → Organizations."
            : "Open Admin → Organizations for plan changes.",
          nextStep: tr
            ? "Projeler veya kullanımı sorun."
            : "Ask about projects or usage.",
        })
      );
      continue;
    }

    if (tool.intent === "USAGE") {
      const totals = (d.totals || {}) as Record<string, number>;
      blocks.push(
        formatSections(lang, {
          status: L.ok,
          summary: tr
            ? `Kullanım (${d.month ?? "güncel"}): ${totals.requests ?? 0} istek, ${totals.errors ?? 0} hata, ${totals.brainRequests ?? 0} brain, ${totals.monitoringRequests ?? 0} monitoring.${
                typeof d.requestsToday === "number"
                  ? ` Bugünkü istekler: ${d.requestsToday}.`
                  : ""
              }`
            : `Usage (${d.month ?? "current"}): ${totals.requests ?? 0} requests, ${totals.errors ?? 0} errors, ${totals.brainRequests ?? 0} brain, ${totals.monitoringRequests ?? 0} monitoring.${
                typeof d.requestsToday === "number"
                  ? ` Requests today: ${d.requestsToday}.`
                  : ""
              }`,
          recommendation: tr
            ? "Trendler için Admin → Analytics."
            : "Open Admin → Analytics for trends.",
          nextStep: tr
            ? "Olay araştırması için log veya sağlık sorun."
            : "Ask for logs or health if investigating incidents.",
        })
      );
      continue;
    }

    if (tool.intent === "LOGS") {
      const recent = Array.isArray(d.recent) ? d.recent : [];
      const lines = recent
        .map(
          (l: {
            level?: string;
            category?: string;
            createdAt?: string;
            message?: string;
          }) =>
            `• [${l.level}/${l.category}] ${l.createdAt}: ${l.message}`
        )
        .join("\n");
      blocks.push(
        formatSections(lang, {
          status: (d.errorLike as number) > 0 ? L.attention : L.ok,
          summary: tr
            ? `Audit penceresi: ${d.totalInWindow ?? 0} kayıt, ${d.errorLike ?? 0} hata benzeri.`
            : `Audit window: ${d.totalInWindow ?? 0} entries, ${d.errorLike ?? 0} error-like.`,
          extra: [
            {
              title: L.recent,
              body: lines || L.noLogs,
            },
          ],
          recommendation: tr
            ? "Filtreler için Admin → Logs."
            : "Open Admin → Logs for filters.",
          nextStep: tr
            ? "Daha derin analiz için belirli bir hatayı yapıştırın."
            : "Paste a specific error for deeper analysis.",
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
        formatSections(lang, {
          status:
            d.status === "healthy"
              ? L.healthy
              : String(d.status || (tr ? "Bilinmiyor" : "Unknown")),
          summary: tr
            ? `Platform durumu: ${d.status}. Uptime: ${d.uptimeSeconds}s. Sürüm: ${d.platformVersion}.`
            : `Platform status: ${d.status}. Uptime: ${d.uptimeSeconds}s. Version: ${d.platformVersion}.`,
          extra: services ? [{ title: L.services, body: services }] : undefined,
          recommendation:
            d.status === "healthy"
              ? tr
                ? "Ek işlem gerekmiyor."
                : "No action required."
              : tr
                ? "Admin → System Health ve Logs’u kontrol edin."
                : "Inspect Admin → System Health and Logs.",
          nextStep: tr
            ? "Gerekirse kullanım veya son hataları sorun."
            : "Ask about usage or recent errors if needed.",
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
        formatSections(lang, {
          status: L.ok,
          summary: tr
            ? `Analitik: bugün ${d.requestsToday ?? 0} istek, bu ay ${d.monthRequests ?? 0} istek, ${d.monthErrors ?? 0} hata (hata oranı %${d.errorRate ?? 0}), ${d.activeApiKeys ?? 0} aktif anahtar.`
            : `Analytics: ${d.requestsToday ?? 0} requests today, ${d.monthRequests ?? 0} month requests, ${d.monthErrors ?? 0} month errors (${d.errorRate ?? 0}% error rate), ${d.activeApiKeys ?? 0} active keys.`,
          extra: topLines ? [{ title: L.topKeys, body: topLines }] : undefined,
          recommendation: tr
            ? "Tam seri için Admin → Analytics."
            : "Open Admin → Analytics for full series.",
          nextStep: tr
            ? "En çok istek üreten uygulamayı sorun."
            : "Ask which application generated the most requests.",
        })
      );
      continue;
    }

    if (tool.intent === "DOCUMENTATION") {
      const articles = Array.isArray(d.articles) ? d.articles : [];
      if (!articles.length) {
        blocks.push(
          formatSections(lang, {
            status: L.documentation,
            summary: L.noDocs,
            recommendation: tr
              ? "Authentication, REST API, API Keys, Webhooks veya Rate Limits deneyin."
              : "Try Authentication, REST API, API Keys, Webhooks, or Rate Limits.",
            nextStep: tr
              ? "Dil bazlı entegrasyon örneği isteyin."
              : "Ask for a language-specific integration example.",
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
          formatSections(lang, {
            status: L.documentation,
            summary: tr
              ? `${articles.length} Helia dokümantasyon kaydı eşleşti.`
              : `Matched ${articles.length} Helia documentation article(s).`,
            extra: [{ title: L.details, body }],
            recommendation: tr
              ? "Tam referans için Dashboard → Documentation."
              : "Open Dashboard → Documentation for the full reference.",
            nextStep: tr
              ? "Entegrasyon için kod örneği isteyin."
              : "Request a code example if you need an integration snippet.",
          })
        );
      }
      continue;
    }

    if (tool.intent === "CODE_GENERATION" || tool.intent === "INTEGRATIONS") {
      blocks.push(
        formatSections(lang, {
          status: L.codeGen,
          summary: tr
            ? `${d.endpoint || "Helia REST"} için production-ready ${d.language || "entegrasyon"} örneği.`
            : `Production-ready ${d.language || "integration"} example for ${d.endpoint || "Helia REST"}.`,
          extra: [
            {
              title: String(d.language || L.example),
              body: "```\n" + String(d.code || "") + "\n```",
            },
          ],
          recommendation: String(
            d.authHeader ||
              (tr
                ? "HELIA_API_KEY’i sunucu ortamında tutun. Live key’i tarayıcıya koymayın."
                : "Keep HELIA_API_KEY in server env. Never ship live keys to browsers.")
          ),
          nextStep: tr
            ? "Önce hl_test_ anahtarıyla deneyin."
            : "Test with a hl_test_ key before production.",
        })
      );
      continue;
    }

    if (tool.intent === "GENERAL") {
      blocks.push(
        formatSections(lang, {
          status: L.adminTitle,
          summary: tr
            ? "Helia Suite’i canlı araçlarla yönetirim: API anahtarları, projeler, organizasyonlar, kullanım, sağlık, loglar, analitik, dokümantasyon ve entegrasyonlar."
            : "I operate Helia Suite with live platform tools: API keys, projects, organizations, usage, health, logs, analytics, documentation, and integrations.",
          recommendation: tr
            ? "Bir platform sorusu sorun veya entegrasyon örneği isteyin."
            : "Ask a platform question or request an integration example.",
          nextStep: tr
            ? "Örnek: Kaç API anahtarım var?"
            : "Example: How many API Keys do I have?",
        })
      );
      continue;
    }

    blocks.push(
      formatSections(lang, {
        status: L.ok,
        summary: tr
          ? `${tool.tool} yapılandırılmış veri döndürdü.`
          : `Tool ${tool.tool} returned structured data.`,
        extra: [
          {
            title: L.data,
            body: "```json\n" + JSON.stringify(d, null, 2) + "\n```",
          },
        ],
      })
    );
  }

  if (!blocks.length) {
    return formatSections(lang, {
      status: tr ? "Dokümantasyon asistanı" : "Documentation assistant",
      summary: tr
        ? "Helia API’leri, anahtarlar, kullanım, sağlık, loglar ve entegrasyonlarda yardımcı olabilirim. Platform sorusu sorun, canlı servisleri sorgulayayım."
        : "I can help with Helia APIs, keys, usage, health, logs, and integrations. Ask a platform question and I will query the live services.",
      nextStep: tr
        ? "Deneyin: Kaç projem var? veya Bugünkü kullanımı göster."
        : "Try: How many projects? or Show today's usage.",
    });
  }

  return blocks.join("\n\n---\n\n");
}

async function formatWithOpenAi(
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

  const lang = packet.replyLanguage ?? detectReplyLanguage(packet.userMessage);
  const langRule =
    lang === "tr"
      ? "Reply entirely in Turkish (section labels Durum/Özet/Öneri/Sonraki adım)."
      : "Reply entirely in English (section labels Status/Summary/Recommendation/Next Step).";

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
          content: `You are the Helia Suite response formatter. You receive structured tool JSON only. Never invent platform numbers. ${langRule} If security.blocked, use the localized security message.`,
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
