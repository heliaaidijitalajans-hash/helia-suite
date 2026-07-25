/**
 * Reply language detection for Helia Admin Chat.
 * Turkish → Turkish answers; English (default) → English answers.
 */

export type ReplyLanguage = "tr" | "en";

const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜ]/;

const TURKISH_TOKENS = [
  "kaç",
  "nedir",
  "nasıl",
  "neden",
  "hangi",
  "var",
  "yok",
  "göster",
  "listele",
  "açıkla",
  "merhaba",
  "selam",
  "teşekkür",
  "lütfen",
  "bugün",
  "dün",
  "hafta",
  "ay",
  "proje",
  "projeler",
  "organizasyon",
  "organizasyonlar",
  "kurum",
  "kullanım",
  "istek",
  "hata",
  "hatalar",
  "sağlık",
  "durum",
  "anahtar",
  "anahtarlar",
  "belge",
  "dokümantasyon",
  "entegrasyon",
  "örnek",
  "kod",
  "yenile",
  "döndür",
  "devre",
  "dışı",
  "aktif",
  "toplam",
  "kaçtane",
  "var mı",
  "neler",
  "yapabilirsin",
  "platform",
  "günlük",
  "loglar",
  "logları",
  "sağlıklı",
  "mı",
  "mi",
  "mu",
  "mü",
];

export function detectReplyLanguage(text: string): ReplyLanguage {
  const raw = text.trim();
  if (!raw) return "en";

  let scoreTr = 0;
  let scoreEn = 0;

  if (TURKISH_CHARS.test(raw)) scoreTr += 4;

  const lower = raw.toLowerCase();
  for (const token of TURKISH_TOKENS) {
    if (lower.includes(token)) scoreTr += 2;
  }

  const enHints = [
    "how many",
    "what is",
    "show",
    "list",
    "usage",
    "healthy",
    "projects",
    "organizations",
    "api keys",
    "please",
    "today",
    "error",
    "documentation",
  ];
  for (const hint of enHints) {
    if (lower.includes(hint)) scoreEn += 2;
  }

  // Short Turkish question particles
  if (/\b(mı|mi|mu|mü)\b/i.test(raw)) scoreTr += 3;

  if (scoreTr === 0 && scoreEn === 0) {
    // Prefer TR if message has mostly non-ascii latin extensions already handled;
    // otherwise default English for mixed/unknown.
    return "en";
  }

  return scoreTr >= scoreEn ? "tr" : "en";
}

export function securityBlockedMessage(lang: ReplyLanguage): string {
  return lang === "tr"
    ? "Bu işlem Helia güvenlik politikası tarafından engellendi."
    : "This operation is blocked by the Helia security policy.";
}

export type UiLabels = {
  status: string;
  summary: string;
  recommendation: string;
  nextStep: string;
  ok: string;
  attention: string;
  healthy: string;
  toolError: string;
  keys: string;
  projects: string;
  organizations: string;
  recent: string;
  services: string;
  topKeys: string;
  details: string;
  data: string;
  newest: string;
  documentation: string;
  codeGen: string;
  example: string;
  noDocs: string;
  noLogs: string;
  adminTitle: string;
};

export function uiLabels(lang: ReplyLanguage): UiLabels {
  if (lang === "tr") {
    return {
      status: "Durum",
      summary: "Özet",
      recommendation: "Öneri",
      nextStep: "Sonraki adım",
      ok: "Tamam",
      attention: "Dikkat",
      healthy: "Sağlıklı",
      toolError: "Araç hatası",
      keys: "Anahtarlar",
      projects: "Projeler",
      organizations: "Organizasyonlar",
      recent: "Son kayıtlar",
      services: "Servisler",
      topKeys: "En çok kullanılan anahtarlar",
      details: "Detaylar",
      data: "Veri",
      newest: "En yeni / en son",
      documentation: "Dokümantasyon",
      codeGen: "Kod üretimi",
      example: "Örnek",
      noDocs: "Dokümantasyon bulunamadı.",
      noLogs: "Log kaydı yok.",
      adminTitle: "Helia Suite AI Yöneticisi",
    };
  }
  return {
    status: "Status",
    summary: "Summary",
    recommendation: "Recommendation",
    nextStep: "Next Step",
    ok: "OK",
    attention: "Attention",
    healthy: "Healthy",
    toolError: "Tool error",
    keys: "Keys",
    projects: "Projects",
    organizations: "Organizations",
    recent: "Recent",
    services: "Services",
    topKeys: "Top keys",
    details: "Details",
    data: "Data",
    newest: "Newest / most recent",
    documentation: "Documentation",
    codeGen: "Code generation",
    example: "Example",
    noDocs: "No documentation found.",
    noLogs: "No log rows.",
    adminTitle: "Helia Suite AI Administrator",
  };
}
