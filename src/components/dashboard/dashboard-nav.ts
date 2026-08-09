import {
  ChartNoAxesCombined,
  LayoutDashboard,
  Settings,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Locale } from "@/config/i18n";
import { getPlatformUi } from "@/lib/platform-ui-dict";

export type DashboardNavKey =
  | "overview"
  | "usage"
  | "profile"
  | "settings";

export type DashboardNavItem = {
  href: string;
  key: DashboardNavKey;
  label: string;
  icon: LucideIcon;
};

const DASHBOARD_NAV_DEFS: Array<{
  href: string;
  key: DashboardNavKey;
  icon: LucideIcon;
}> = [
  { href: "/dashboard", key: "overview", icon: LayoutDashboard },
  { href: "/dashboard/usage", key: "usage", icon: ChartNoAxesCombined },
  { href: "/dashboard/profile", key: "profile", icon: UserRound },
  { href: "/dashboard/settings", key: "settings", icon: Settings },
];

/** Customer dashboard routes — always under /dashboard (not /{locale}/…). */
export function getDashboardNav(locale: Locale): DashboardNavItem[] {
  const labels = getPlatformUi(locale).dashboardNav;
  return DASHBOARD_NAV_DEFS.map((item) => ({
    ...item,
    label: labels[item.key],
  }));
}

/** @deprecated Prefer getDashboardNav(locale) */
export const dashboardNav = getDashboardNav("en");

export function dashboardTitleForPath(
  pathname: string,
  locale: Locale = "en"
): string {
  const nav = getDashboardNav(locale);
  const item = nav.find(
    (n) =>
      n.href === pathname ||
      (n.href !== "/dashboard" && pathname.startsWith(n.href))
  );
  if (item) return item.label;
  if (pathname === "/dashboard") return getPlatformUi(locale).dashboardNav.overview;
  return getPlatformUi(locale).shell.platform;
}
