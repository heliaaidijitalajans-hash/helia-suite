import {
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Plug,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const dashboardNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/helia-chat", label: "Helia Chat", icon: MessageSquare },
  { href: "/dashboard/organizations", label: "Organizations", icon: Building2 },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/dashboard/usage", label: "Usage", icon: ChartNoAxesCombined },
  { href: "/dashboard/documentation", label: "Documentation", icon: BookOpen },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
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
