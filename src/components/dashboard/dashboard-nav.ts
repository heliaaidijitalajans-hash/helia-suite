import {
  BookOpen,
  ChartNoAxesCombined,
  KeyRound,
  LayoutDashboard,
  Plug,
  Settings,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { defaultLocale, isLocale, type Locale } from "@/config/i18n";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Customer API dashboard nav — paths are /dashboard/... (locale prefix added at link time). */
export const dashboardNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/dashboard/usage", label: "Usage", icon: ChartNoAxesCombined },
  { href: "/dashboard/documentation", label: "Documentation", icon: BookOpen },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/profile", label: "Kişisel Bilgiler", icon: UserRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function localeFromPathname(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  return first && isLocale(first) ? first : defaultLocale;
}

/** Strip /{locale} so /en/dashboard/api-keys → /dashboard/api-keys */
export function dashboardPathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && isLocale(parts[0])) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function localizedDashboardHref(locale: Locale, href: string): string {
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

export function dashboardTitleForPath(pathname: string): string {
  const path = dashboardPathname(pathname);
  const item = dashboardNav.find(
    (n) =>
      n.href === path ||
      (n.href !== "/dashboard" && path.startsWith(n.href))
  );
  if (item) return item.label;
  if (path === "/dashboard") return "Overview";
  return "Dashboard";
}
