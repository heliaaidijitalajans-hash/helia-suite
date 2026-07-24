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

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Customer dashboard routes — always under /dashboard (not /{locale}/…). */
export const dashboardNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/dashboard/usage", label: "Usage", icon: ChartNoAxesCombined },
  { href: "/dashboard/documentation", label: "Documentation", icon: BookOpen },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/profile", label: "Kişisel Bilgiler", icon: UserRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function dashboardTitleForPath(pathname: string): string {
  const item = dashboardNav.find(
    (n) =>
      n.href === pathname ||
      (n.href !== "/dashboard" && pathname.startsWith(n.href))
  );
  if (item) return item.label;
  if (pathname === "/dashboard") return "Overview";
  return "Dashboard";
}
