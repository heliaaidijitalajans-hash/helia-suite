import {
  Building2,
  ChartNoAxesCombined,
  HeartPulse,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Locale } from "@/config/i18n";
import { getPlatformUi } from "@/lib/platform-ui-dict";

export type AdminNavKey =
  | "dashboard"
  | "users"
  | "organizations"
  | "logs"
  | "analytics"
  | "systemHealth"
  | "settings";

export type AdminNavItem = {
  href: string;
  key: AdminNavKey;
  label: string;
  icon: LucideIcon;
};

const ADMIN_NAV_DEFS: Array<{
  href: string;
  key: AdminNavKey;
  icon: LucideIcon;
}> = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/users", key: "users", icon: Users },
  { href: "/admin/organizations", key: "organizations", icon: Building2 },
  { href: "/admin/logs", key: "logs", icon: ScrollText },
  { href: "/admin/analytics", key: "analytics", icon: ChartNoAxesCombined },
  { href: "/admin/system-health", key: "systemHealth", icon: HeartPulse },
  { href: "/admin/settings", key: "settings", icon: Settings },
];

export function getAdminNav(locale: Locale): AdminNavItem[] {
  const labels = getPlatformUi(locale).adminNav;
  return ADMIN_NAV_DEFS.map((item) => ({
    ...item,
    label: labels[item.key],
  }));
}

/** @deprecated Prefer getAdminNav(locale) */
export const adminNav = getAdminNav("en");

export function adminTitleForPath(
  pathname: string,
  locale: Locale = "en"
): string {
  const nav = getAdminNav(locale);
  const item = nav.find(
    (n) =>
      n.href === pathname ||
      (n.href !== "/admin" && pathname.startsWith(n.href))
  );
  return item?.label ?? "Admin";
}
