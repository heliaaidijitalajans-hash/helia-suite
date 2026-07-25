import type { Locale } from "@/config/i18n";

export type PlatformUiDict = {
  dashboardNav: {
    overview: string;
    apiKeys: string;
    usage: string;
    documentation: string;
    integrations: string;
    profile: string;
    settings: string;
  };
  adminNav: {
    dashboard: string;
    chat: string;
    users: string;
    organizations: string;
    applications: string;
    apiKeys: string;
    apiTester: string;
    logs: string;
    analytics: string;
    systemHealth: string;
    settings: string;
  };
  shell: {
    platform: string;
    adminConsole: string;
    heliaApiPlatform: string;
    heliaSuiteAdmin: string;
    internalOnly: string;
    customerPlatform: string;
    openMenu: string;
    closeMenu: string;
    logout: string;
    search: string;
    notifications: string;
    openProfile: string;
    language: string;
  };
  dashboardHome: {
    eyebrow: string;
    title: string;
    body: string;
    pillarApiKeys: string;
    pillarMonitoring: string;
    pillarIntegrations: string;
    pillarDocs: string;
    ctaKeys: string;
    ctaDocs: string;
    onboardingTitle: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    step4Title: string;
    step4Body: string;
  };
  adminHome: {
    title: string;
    subtitle: string;
    loading: string;
    users: string;
    organizations: string;
    projects: string;
    activeKeys: string;
    requestsToday: string;
    monthRequests: string;
    monthErrors: string;
    uptime: string;
    latestActivity: string;
    recentDeployments: string;
    emptyActivity: string;
  };
  common: {
    loading: string;
    save: string;
    saving: string;
    cancel: string;
    retry: string;
    error: string;
  };
};

const en: PlatformUiDict = {
  dashboardNav: {
    overview: "Overview",
    apiKeys: "API Keys",
    usage: "Usage",
    documentation: "Documentation",
    integrations: "Integrations",
    profile: "Profile",
    settings: "Settings",
  },
  adminNav: {
    dashboard: "Dashboard",
    chat: "Helia Chat",
    users: "Users",
    organizations: "Organizations",
    applications: "Applications",
    apiKeys: "API Keys",
    apiTester: "API Tester",
    logs: "Logs",
    analytics: "Analytics",
    systemHealth: "System Health",
    settings: "Settings",
  },
  shell: {
    platform: "Platform",
    adminConsole: "Admin Console",
    heliaApiPlatform: "Helia API Platform",
    heliaSuiteAdmin: "Helia Suite Admin",
    internalOnly: "Internal operators only",
    customerPlatform: "Customer Platform",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    logout: "Logout",
    search: "Search",
    notifications: "Notifications",
    openProfile: "Open profile",
    language: "Language",
  },
  dashboardHome: {
    eyebrow: "Helia API Platform",
    title: "Welcome to Helia",
    body: "Helia is an AI platform for your products. Manage API keys, monitor usage, and connect applications — from one customer portal.",
    pillarApiKeys: "API Keys",
    pillarMonitoring: "Monitoring",
    pillarIntegrations: "Integrations",
    pillarDocs: "Documentation",
    ctaKeys: "Generate API Key",
    ctaDocs: "Read Documentation",
    onboardingTitle: "Get started",
    step1Title: "Generate API Key",
    step1Body: "Issue a capability-scoped key for your workspace.",
    step2Title: "Read Documentation",
    step2Body: "Learn auth, REST, SDK, webhooks, and rate limits.",
    step3Title: "Integrate",
    step3Body: "Connect Helia to Next.js, Node, Flutter, and more.",
    step4Title: "Monitor Usage",
    step4Body: "Track requests and usage for your workspace.",
  },
  adminHome: {
    title: "Admin overview",
    subtitle: "Live platform totals and recent activity.",
    loading: "Loading admin overview…",
    users: "Users",
    organizations: "Organizations",
    projects: "Projects",
    activeKeys: "Active API keys",
    requestsToday: "Requests today",
    monthRequests: "Month requests",
    monthErrors: "Month errors",
    uptime: "Uptime",
    latestActivity: "Latest activity",
    recentDeployments: "Recent deployments",
    emptyActivity: "No recent activity.",
  },
  common: {
    loading: "Loading…",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    retry: "Retry",
    error: "Something went wrong",
  },
};

const tr: PlatformUiDict = {
  dashboardNav: {
    overview: "Genel bakış",
    apiKeys: "API Anahtarları",
    usage: "Kullanım",
    documentation: "Dokümantasyon",
    integrations: "Entegrasyonlar",
    profile: "Kişisel bilgiler",
    settings: "Ayarlar",
  },
  adminNav: {
    dashboard: "Panel",
    chat: "Helia Chat",
    users: "Kullanıcılar",
    organizations: "Organizasyonlar",
    applications: "Uygulamalar",
    apiKeys: "API Anahtarları",
    apiTester: "API Test Aracı",
    logs: "Kayıtlar",
    analytics: "Analitik",
    systemHealth: "Sistem sağlığı",
    settings: "Ayarlar",
  },
  shell: {
    platform: "Platform",
    adminConsole: "Yönetim konsolu",
    heliaApiPlatform: "Helia API Platformu",
    heliaSuiteAdmin: "Helia Suite Yönetim",
    internalOnly: "Yalnızca dahili operatörler",
    customerPlatform: "Müşteri platformu",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    logout: "Çıkış",
    search: "Ara",
    notifications: "Bildirimler",
    openProfile: "Profili aç",
    language: "Dil",
  },
  dashboardHome: {
    eyebrow: "Helia API Platformu",
    title: "Helia’ya hoş geldiniz",
    body: "Helia, ürünleriniz için bir yapay zeka platformudur. API anahtarlarını yönetin, kullanımı izleyin ve uygulamaları tek müşteri portalından bağlayın.",
    pillarApiKeys: "API Anahtarları",
    pillarMonitoring: "İzleme",
    pillarIntegrations: "Entegrasyonlar",
    pillarDocs: "Dokümantasyon",
    ctaKeys: "API anahtarı oluştur",
    ctaDocs: "Dokümantasyonu oku",
    onboardingTitle: "Başlangıç",
    step1Title: "API anahtarı oluştur",
    step1Body: "Çalışma alanınız için yetki kapsamlı bir anahtar yayınlayın.",
    step2Title: "Dokümantasyonu okuyun",
    step2Body: "Kimlik doğrulama, REST, SDK, webhook ve limitleri öğrenin.",
    step3Title: "Entegre edin",
    step3Body: "Helia’yı Next.js, Node, Flutter ve daha fazlasına bağlayın.",
    step4Title: "Kullanımı izleyin",
    step4Body: "Çalışma alanınızın istek ve kullanımını takip edin.",
  },
  adminHome: {
    title: "Yönetim özeti",
    subtitle: "Canlı platform toplamları ve son aktiviteler.",
    loading: "Yönetim özeti yükleniyor…",
    users: "Kullanıcılar",
    organizations: "Organizasyonlar",
    projects: "Projeler",
    activeKeys: "Aktif API anahtarları",
    requestsToday: "Bugünkü istekler",
    monthRequests: "Aylık istekler",
    monthErrors: "Aylık hatalar",
    uptime: "Çalışma süresi",
    latestActivity: "Son aktivite",
    recentDeployments: "Son dağıtımlar",
    emptyActivity: "Son aktivite yok.",
  },
  common: {
    loading: "Yükleniyor…",
    save: "Kaydet",
    saving: "Kaydediliyor…",
    cancel: "İptal",
    retry: "Yeniden dene",
    error: "Bir şeyler ters gitti",
  },
};

export const platformUiDictionary: Record<Locale, PlatformUiDict> = {
  en,
  tr,
};

export function getPlatformUi(locale: Locale): PlatformUiDict {
  return platformUiDictionary[locale] ?? platformUiDictionary.en;
}
