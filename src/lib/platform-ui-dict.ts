import type { Locale } from "@/config/i18n";

export type PlatformUiDict = {
  dashboardNav: {
    overview: string;
    usage: string;
    profile: string;
    settings: string;
  };
  adminNav: {
    dashboard: string;
    users: string;
    organizations: string;
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
    onboardingTitle: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
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
    usage: "Usage",
    profile: "Profile",
    settings: "Settings",
  },
  adminNav: {
    dashboard: "Dashboard",
    users: "Users",
    organizations: "Organizations",
    logs: "Logs",
    analytics: "Analytics",
    systemHealth: "System Health",
    settings: "Settings",
  },
  shell: {
    platform: "Platform",
    adminConsole: "Admin Console",
    heliaApiPlatform: "Helia Platform",
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
    eyebrow: "Helia Suite",
    title: "Welcome to Helia",
    body: "Manage your Helia Suite workspace — profile, settings, and account usage in one place.",
    onboardingTitle: "Get started",
    step1Title: "Complete your profile",
    step1Body: "Add your display details so your team knows who you are.",
    step2Title: "Review settings",
    step2Body: "Confirm preferences for your customer portal.",
    step3Title: "Monitor usage",
    step3Body: "Track workspace activity when metering is enabled.",
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
    usage: "Kullanım",
    profile: "Kişisel bilgiler",
    settings: "Ayarlar",
  },
  adminNav: {
    dashboard: "Panel",
    users: "Kullanıcılar",
    organizations: "Organizasyonlar",
    logs: "Kayıtlar",
    analytics: "Analitik",
    systemHealth: "Sistem sağlığı",
    settings: "Ayarlar",
  },
  shell: {
    platform: "Platform",
    adminConsole: "Yönetim konsolu",
    heliaApiPlatform: "Helia Platformu",
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
    eyebrow: "Helia Suite",
    title: "Helia’ya hoş geldiniz",
    body: "Helia Suite çalışma alanınızı yönetin — profil, ayarlar ve hesap kullanımı tek yerde.",
    onboardingTitle: "Başlangıç",
    step1Title: "Profilinizi tamamlayın",
    step1Body: "Ekibinizin sizi tanıması için görünen bilgilerinizi ekleyin.",
    step2Title: "Ayarları gözden geçirin",
    step2Body: "Müşteri portalı tercihlerinizi doğrulayın.",
    step3Title: "Kullanımı izleyin",
    step3Body: "Ölçüm açıksa çalışma alanı aktivitesini takip edin.",
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
