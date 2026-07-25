import {
  Building2,
  ChartNoAxesCombined,
  FlaskConical,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  AppWindow,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/applications", label: "Applications", icon: AppWindow },
  { href: "/admin/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/admin/api-tester", label: "API Tester", icon: FlaskConical },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
  { href: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/admin/system-health", label: "System Health", icon: HeartPulse },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function adminTitleForPath(pathname: string): string {
  const item = adminNav.find(
    (n) =>
      n.href === pathname ||
      (n.href !== "/admin" && pathname.startsWith(n.href))
  );
  return item?.label ?? "Admin";
}
