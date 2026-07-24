import {
  BarChart3,
  Building2,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Workflow,
  ChartNoAxesCombined,
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
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/dashboard/usage", label: "Usage", icon: ChartNoAxesCombined },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/automation", label: "Automation", icon: Workflow },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function dashboardTitleForPath(pathname: string): string {
  const item = dashboardNav.find(
    (n) => n.href === pathname || (n.href !== "/dashboard" && pathname.startsWith(n.href))
  );
  if (item) return item.label;
  if (pathname === "/dashboard") return "Overview";
  return "Dashboard";
}
